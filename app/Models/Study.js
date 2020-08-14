'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const { isArray } = require('lodash')
const { formatISO9075 } = require('date-fns')

const Model = use('Model')
const Database = use('Database')
const pool = use('Workers/Sheets')

/**
*  @swagger
*  definitions:
*    Study:
*      type: object
*      properties:
*        id:
*          type: integer
*          example: 42
*        name:
*          type: string
*          example: Awesome task
*        description:
*          type: string
*          example: This task is awesome
*        active:
*          type: boolean
*        created_at:
*          type: string
*          format: date-time
*        updated_at:
*          type: string
*          format: date-time
*      required:
*        - name
*    StudyWithRelations:
*      allOf:
*         - $ref: '#/definitions/Study'
*         - type: object
*           properties:
*             jobs:
*               type: array
*               description: The jobs belonging to this study
*               items:
*                 $ref: '#/definitions/JobWithRelations'
*             participants:
*               type: array
*               description: Participants assigned to this study
*               items:
*                 $ref: '#/definitions/Participant'
*             variables:
*               type: array
*               description: The variables belonging to this study
*               items:
*                 $ref: '#/definitions/VariableWithRelations'
*             users:
*               type: array
*               description: The users associated with this study
*               items:
*                 $ref: '#/definitions/User'
*             files:
*               type: array
*               description: The experiment and job files for this study
*               items:
*                 $ref: '#/definitions/StudyFile'
*/
class Study extends Model {
  /**
   * The study's owners
   *
   * @method users
   *
   * @return {Object}
   */
  users () {
    return this
      .belongsToMany('App/Models/User')
      .pivotModel('App/Models/StudyUser')
      .withPivot(['is_owner', 'access_permission_id'])
  }

  /**
   * The jobs belonging to this study
   *
   * @method jobs
   *
   * @returns {Object}
   * @memberof Study
   */
  jobs () {
    return this.hasMany('App/Models/Job')
  }

  /**
   * The column headers of the job table (i.e. variable names per job)
   *
   * @method jobFields
   *
   * @returns {Object}
   * @memberof Study
   */
  variables () {
    return this.hasMany('App/Models/Variable')
  }

  /**
   * Participants of this study
   *
   * @method participants
   *
   * @returns {Object}
   * @memberof Study
   */
  participants () {
    return this
      .belongsToMany('App/Models/Participant')
      .pivotModel('App/Models/Participation')
      .withPivot(['status_id', 'created_at', 'updated_at'])
  }

  /**
   * Files belonging to this study
   *
   * @method files
   *
   * @returns {Object}
   * @memberof Study
   */
  files () {
    return this.hasMany('App/Models/StudyFile')
  }

  /**
   * Checks if the passed user has sufficient privileges to edit this study
   *
   * @param {User} user
   * @returns {Boolean}
   * @memberof Study
   */
  async isEditableBy (user) {
    const results = await this.users()
      .where('id', user.id)
      .where(function () {
        this
          .where('study_users.is_owner', true) // Either the user is the owner of the study
          .orWhere('study_users.access_permission_id', 2) // Or has write permissions
      })
      .count('* as total')
    return !!results[0].total
  }

  /**
   * Checks if the passed user is the owner of the study
   *
   * @param {User} user
   * @returns {Boolean}
   * @memberof Study
   */
  async isOwnedBy (user) {
    const results = await this.users()
      .where('id', user.id)
      .where('study_users.is_owner', true) // Either the user is the owner of the study
      .count('* as total')
    return !!results[0].total
  }

  /**
   * Walks through the list of jobs specified as a collection of key:value pairs in an object
   * and transform them so that they can easily be stored in the
   * database. Additionally check if the supplied variable name exists for this study.
   *
   * @param {Array} jobsData The jobs to transform
   * @param {Database} trx The jobs to transform
   * @returns {Array}
   * @memberof Study
   */
  async saveJobsFromInput (jobsData, trx) {
    // Obtain the list of variables that are used for this study.
    const variables = await this.variables().pair('name', 'id')

    const jobs = await Promise.all(jobsData.map(async (jobData) => {
      if (trx) {
        return await this._trxSaveJobsFromInput(jobData, variables, trx)
      } else {
        return await this._noTrxSaveJobsFromInput(jobData, variables)
      }
    }))
    return jobs
  }

  /**
   * Process a jobs file (csv/xls(x))
   *
   * @param {String} path
   * @memberof Study
   */
  async processJobsFile (path) {
    // const workbook = XLSX.readFile(path)
    // const sheet = workbook.Sheets[workbook.SheetNames[0]]
    // const jsonData = XLSX.utils.sheet_to_json(sheet)
    const jsonData = await pool.exec('readSheet', [path])

    const variables = Object.keys(jsonData[0]).map(varName => ({
      name: varName,
      dtype_id: 1
    }))

    // Delete old jobs data
    await this.jobs().delete()
    await this.variables().delete()

    // Create the variables in the database
    const variableRecords = await this.variables().createMany(variables)
    // Compose an object in which the key is the varname and value is its ID
    const varTable = variableRecords.reduce((result, current) => {
      result[current.id] = current.name
      return result
    }, {})

    for (const [i, row] of Object.entries(jsonData)) {
      const job = await this.jobs().create({
        position: parseInt(i) + 1
      })

      await job.variables().attach(Object.keys(varTable), (record) => {
        record.value = row[varTable[record.variable_id]]
      })
    }
  }

  async attachParticipantsToJobs () {
    let ptcpIDs, jobIDs
    const loadedPtcps = this.getRelated('participants')
    const loadedJobs = this.getRelated('jobs')

    if (isArray(loadedPtcps?.rows)) {
      ptcpIDs = loadedPtcps.rows.map(ptcp => ptcp.id)
    } else {
      ptcpIDs = await this.participants().ids()
    }

    if (isArray(loadedJobs?.rows)) {
      jobIDs = loadedJobs.rows.map(ptcp => ptcp.id)
    } else {
      jobIDs = await this.jobs().ids()
    }
    // If there are no participants or jobs for the study, there is nothing left to do
    if (ptcpIDs.length === 0 || jobIDs.length === 0) {
      return
    }

    const records = []
    // eslint-disable-next-line camelcase
    for (const job_id of jobIDs) {
      // eslint-disable-next-line camelcase
      for (const participant_id of ptcpIDs) {
        records.push({
          job_id,
          participant_id,
          created_at: formatISO9075(Date.now()),
          updated_at: formatISO9075(Date.now())
        })
      }
    }
    await Database.table('job_states').insert(records)
  }

  async getCollectedData () {
    const jobs = await this.jobs()
      .with('variables', (query) => {
        query.select('id', 'name')
      })
      .with('participants')
      .select('id', 'position', 'study_id')
      .fetch()

    // Offload below to worker thread
    return await pool.exec('writeSheet', [jobs.toJSON()])
  }

  /* Private functions */

  /**
   * Save Jobs using transaction (for DB other than )
   *
   * @param {*} jobData
   * @param {*} variables
   * @param {*} trx
   * @returns
   * @memberof Study
   */
  async _trxSaveJobsFromInput (jobData, variables, trx) {
    const varsList = Object.keys(variables)
    // Create the job
    const job = await this.jobs().create({}, trx)

    for (const [varName, varValue] of Object.entries(jobData)) {
      // Check if all variables exists for this study
      if (!varsList.includes(varName)) {
        throw new ReferenceError(`Variable '${varName}' does not exist for this study.`)
      }
      await job.variables().attach(variables[varName], (row) => { row.value = varValue }, trx)
    }
    return job
  }

  async _noTrxSaveJobsFromInput (jobData, variables) {
    const varsList = Object.keys(variables)

    for (const varName of Object.keys(jobData)) {
      // Check if all variables exists for this study
      if (!varsList.includes(varName)) {
        throw new ReferenceError(`Variable '${varName}' does not exist for this study.`)
      }
    }
    // Create the job
    const job = await this.jobs().create({})

    for (const [varName, varValue] of Object.entries(jobData)) {
      await job.variables().attach(variables[varName], (row) => { row.value = varValue })
    }
    return job
  }
}

module.exports = Study
