const axios = require(\ axios\);

/**
 * Unstop Service for fetching hackathons.
 */
const UnstopService = {
  async fetchHackathons() {
    try {
      const response = await axios.get(\https://unstop.com/api/hackathons/list\, {
        headers: {
          \User-Agent\: \Mozilla/5.0\,
          \Accept\: \application/json\,
        },
        params: {
          category: \hackathons\,
          page: 1,
          pageSize: 50
        }
      });

      const events = response.data.data || [];
      
      return events.map(event => ({
        external_id: event.id,
        title: event.title,
        organizer: event.organizer?.name || \Not announced\,
        platform: \Unstop\,
        description: event.description || \No description available\,
        start_date: event.startDate || \Not announced\,
        end_date: event.endDate || \Not announced\,
        registration_deadline: event.registrationDeadline || \Not announced\,
        location: event.location || \Online\,
        mode: event.mode || \Online\,
        prize: event.prizeMoney || \Not announced\,
        eligibility: event.eligibility || \Not announced\,
        team_size: event.teamSize || \Not announced\,
        event_url: https://unstop.com/p/,
        registration_url: https://unstop.com/p/,
        last_synced: new Date().toISOString(),
      }));
    } catch (error) {
      console.error(\Unstop Service Error:\, error.message);
      return [];
    }
  }
};

module.exports = UnstopService;
