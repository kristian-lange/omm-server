'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class StudyUser extends Model {
  static boot () {
    super.boot()
    this.addHook('beforeCreate', (studyModel) => {
      studyModel.is_owner = false
      studyModel.access_permission_id = 2
    })
  }

  /**
   * The permissions the related user has on this study (e.g. read, write)
   *
   * @method accessPermission
   *
   * @return {Object}
   */
  accessPermission () {
    return this.hasOne('App/Models/AccessPermission')
  }

  /**
   * The related user
   *
   * @method user
   *
   * @return {Object}
   */
  user () {
    return this.belongsTo('App/Models/User')
  }

  /**
   * The related study
   *
   * @method study
   *
   * @return {Object}
   */
  study () {
    return this.belongsTo('App/Models/Study')
  }
}

module.exports = StudyUser
