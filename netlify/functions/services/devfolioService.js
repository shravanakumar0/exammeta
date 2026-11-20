const axios = require(\ axios\);

/**
 * Devfolio Service for fetching hackathons.
 */
const DevfolioService = {
  async fetchHackathons() {
    try {
      const response = await axios.get(\https://devfolio.co/api/hackathons\, {
        headers: { \User-Agent\: \Mozilla/5.0\ }
      });

      const events = response.data.hackathons || [];
      
      return events.map(event => ({
        external_id: event.id,
        title: event.title,
        organizer: event.organizer || \Not announced\,
        platform: \Devfolio\,
        description: event.description || \No description available\,
        start_date: event.startDate || \Not announced\,
        end_date: event.endDate || \Not announced\,
        registration_deadline: event.deadline || \Not announced\,
        location: event.location || \Online\,
        mode: event.mode || \Online\,
        prize: event.prize || \Not announced\,
        eligibility: event.eligibility || \Not announced\,
        team_size: event.teamSize || \Not announced\,
        event_url: https://devfolio.co/hackathons/,
        registration_url: https://devfolio.co/hackathons/,
        last_synced: new Date().toISOString(),
      }));
    } catch (error) {
      console.error(\Devfolio Service Error:\, error.message);
      return [];
    }
  }
};

module.exports = DevfolioService;
