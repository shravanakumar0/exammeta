const LOCAL_HACKATHONS_KEY = "exammeta.localHackathons.v1";

const indiaToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

const readLocalHackathons = () => {
  try {
    const entries = JSON.parse(window.localStorage.getItem(LOCAL_HACKATHONS_KEY) || "[]");
    return Array.isArray(entries) ? entries : [];
  } catch { return []; }
};

const writeLocalHackathons = entries => window.localStorage.setItem(LOCAL_HACKATHONS_KEY, JSON.stringify(entries));

const mapHackathon = item => ({
  id: item.id, title: item.name, organizer: item.organizer, description: item.description,
  startDate: item.event_date, endDate: item.event_date, registrationDeadline: item.registration_deadline,
  location: item.location, mode: item.mode, registrationUrl: item.registration_url,
  eventUrl: item.registration_url, contactEmail: item.contact_email, thumbnailUrl: item.poster_url,
  provider: "Saved on this device", tags: ["Local listing"], isCommunity: true, isLocal: true
});

export async function getCommunityHackathons() {
  const active = readLocalHackathons().filter(item => item.registration_deadline >= indiaToday());
  writeLocalHackathons(active);
  return active.map(mapHackathon).sort((a, b) => a.startDate.localeCompare(b.startDate));
}

export async function submitHackathon(payload) {
  const record = { ...payload, id: crypto.randomUUID(), created_at: new Date().toISOString() };
  writeLocalHackathons([record, ...readLocalHackathons()]);
  return mapHackathon(record);
}
