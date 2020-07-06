'use strict'

const Participant = use('App/Models/Participant')
const Study = use('App/Models/Study')

/*
|--------------------------------------------------------------------------
| ParticipationSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

class ParticipationSeeder {
  async run () {
    // Don't seed any studies if there already are some.
    if (await Participant.getCount() === 0 || await Study.getCount() === 0) {
      return
    }

    // Sync participants to studies
    const ptcpIds = await Participant.ids()
    const study = await Study.find(1)
    await study.participants().sync(ptcpIds)

    // Sync participants to jobs of the study
    const jobs = await study.jobs().fetch()
    for (const job of jobs.rows) {
      await job.participants().sync(ptcpIds)
    }
  }
}

module.exports = ParticipationSeeder
