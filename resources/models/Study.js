import { Model } from '@vuex-orm/core'

import User from './User'
import StudyUser from './StudyUser'
import Job from './Job'
import JobVariable from './JobVariable'
import Variable from './Variable'

import { STUDIES } from '@/assets/js/endpoints'

export default class Study extends Model {
  static entity = 'studies'

  static apiConfig = {
    baseURL: STUDIES
  }

  static fetch (config) {
    return this.api().get('', config)
  }

  static async fetchById (id, config) {
    const result = await this.api().get(id, config)
    // TEMPORARY FIX to store JobVariable pivot data correctly
    const jobs = result.response.data.data.jobs
    for (const job of jobs) {
      for (const variable of job.variables) {
        await JobVariable.update({
          where: [variable.pivot.job_id, variable.pivot.variable_id],
          data: {
            value: variable.pivot.value
          }
        })
      }
    }
    return result
  }

  static persist (data, config) {
    if (data.id) {
      return this.api().patch(`/${data.id}`, data, config)
    }
    return this.api().post('', data, config)
  }

  destroy (config) {
    return this.constructor.api().delete(`/${this.id}`, { delete: this.id, ...config })
  }

  static fields () {
    return {
      id: this.attr(''),
      name: this.string(''),
      description: this.string(''),
      active: this.boolean(true),
      osexp_path: this.attr(''),
      created_at: this.attr(''),
      updated_at: this.attr(''),
      deleted_at: this.attr(''),
      participants_count: this.number(0),
      users: this.belongsToMany(User, StudyUser, 'study_id', 'user_id'),
      jobs: this.hasMany(Job, 'study_id'),
      variables: this.hasMany(Variable, 'study_id')
    }
  }
}
