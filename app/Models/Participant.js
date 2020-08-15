'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')
/**
*  @swagger
*  definitions:
*    Participant:
*      type: object
*      properties:
*        id:
*          type: integer
*          example: 42
*        name:
*          type: string
*          example: Benny Banana
*        identifier:
*          type: string
*          example: AxcSDD
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
*        - identifier
*    ParticipantWithRelations:
*      allOf:
*         - $ref: '#/definitions/Participant'
*         - type: object
*           properties:
*             studies:
*               type: array
*               items:
*                 $ref: '#/definitions/StudyWithRelations'
*/
class Participant extends Model {
  studies () {
    return this
      .belongsToMany('App/Models/Study')
      .pivotModel('App/Models/Participation')
      .withPivot(['status_id', 'created_at', 'updated_at'])
  }

  jobs () {
    return this
      .belongsToMany('App/Models/Job')
      .pivotModel('App/Models/JobState')
      .withPivot(['data', 'status_id'])
  }
}

module.exports = Participant
