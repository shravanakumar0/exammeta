const axios = require(\ axios\);

/**
 * Devpost Service for fetching hackathons.
 */
const DevpostService = {
  async fetchHackathons() {
    try {
      // Devpost uses a public-facing API for their hackathon discovery
      const response = await axios.get(\https://devpost.com/api/hackathons\, {
        headers: {
          \User-Agent\: \Mozilla/5.0\,
          \Accept\: \application/json\,
        }
      });

      const events = response.data.hackathons || [];
      
      return events.map(event => ({
        external_id: event.id,
        title: event.title,
        organizer: event.organizer || \Not announced\,
        platform: \Devpost\,
        description: event.description || \No description available\,
        start_date: event.startDate || \Not announced\,
        end_date: event.endDate || \Not announced\,
        registration_deadline: event.deadline || \Not announced\,
        location: event.location || \Online\,
        mode: event.mode || \Online\,
        prize: event.prize || \Not announced\,
        eligibility: event.eligibility || \Not announced\,
        team_size: event.teamSize || \Not announced\,
        event_url: https://devpost.com/hackathons/,
        registration_url: https://devpost.com/hackathons/,
        last_synced: new Date().toISOString(),
      }));
    } catch (error) {
      console.error(\Devpost Service Error:\, error.message);
      return [];
    }
  }
};

module.exports = DevpostService;
