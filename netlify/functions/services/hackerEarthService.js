const axios = require(\ axios\);

/**
 * HackerEarth Service for fetching hackathons.
 */
const HackerEarthService = {
  async fetchHackathons() {
    try {
      const response = await axios.get(\https://hackerearth.com/api/hackathons\, {
        headers: { \User-Agent\: \Mozilla/5.0\ }
      });

      const events = response.data.events || [];
      
      return events.map(event => ({
        external_id: event.id,
        title: event.title,
        organizer: event.organizer || \Not announced\,
        platform: \HackerEarth\,
        description: event.description || \No description available\,
        start_date: event.startDate || \Not announced\,
        end_date: event.endDate || \Not announced\,
        registration_deadline: event.deadline || \Not announced\,
        location: event.location || \Online\,
        mode: event.mode || \Online\,
        prize: event.prize || \Not announced\,
        eligibility: event.eligibility || \Not announced\,
        team_size: event.teamSize || \Not announced\,
        event_url: event.url,
        registration_url: event.registrationUrl || event.url,
        last_synced: new Date().toISOString(),
      }));
    } catch (error) {
      console.error(\HackerEarth Service Error:\, error.message);
      return [];
    }
  }
};

module.exports = HackerEarthService;
