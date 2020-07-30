'use strict'

const BumblebeeTransformer = use('Bumblebee/Transformer')

/**
 * JobTransformer class
 *
 * @class JobTransformer
 * @constructor
 */
class JobTransformer extends BumblebeeTransformer {
  static get defaultInclude () {
    return ['variables']
  }

  static get availableInclude () {
    return ['participants']
  }

  transform (model) {
    return {
      ...model.toObject(),
      pivot: model.getRelated('pivot').toJSON()
    }
  }

  includeVariables (job) {
    return this.collection(job.getRelated('variables'), 'VariableTransformer')
  }

  includeParticipants (job) {
    return this.collection(job.getRelated('participants'), 'ParticipantTransformer')
  }
}

module.exports = JobTransformer
