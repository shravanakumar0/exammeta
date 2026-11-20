import { handleHackathonsRequest } from "../server/hackathonsHandler";
import { handleInternshipsRequest } from "../server/internshipsHandler";
import { handleGeminiRequest } from "../server/geminiHandler";

describe("live opportunity search", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    if (originalFetch) global.fetch = originalFetch;
    else delete global.fetch;
    jest.clearAllMocks();
  });

  test("uses live Devpost/Unstop sources and filters Karnataka events", async () => {
    const startDate = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    const eventUrl = "https://devpost.com/student-hackathon";
    global.fetch = jest.fn().mockImplementation(url => Promise.resolve({
      ok: true,
      json: async () => String(url).includes("devpost.com") ? { hackathons: [
        { title: "Student Hackathon", organization_name: "Example University", submission_period_dates: `${startDate} - ${startDate}`, url: eventUrl, displayed_location: { location: "Bengaluru, Karnataka" } },
        { title: "Outside Karnataka", organization_name: "Example", submission_period_dates: `${startDate} - ${startDate}`, url: "https://devpost.com/outside", displayed_location: { location: "Delhi" } },
      ] } : { data: { data: [] } },
    }));

    const result = await handleHackathonsRequest({ region: "Karnataka" }, "test-key");
    expect(result.status).toBe(200);
    expect(result.body.events).toHaveLength(1);
    expect(result.body.events[0].title).toBe("Student Hackathon");
    expect(result.body.events[0].eventUrl).toBe(eventUrl);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("devpost.com/api/hackathons"), expect.anything());
  });

  test("uses InternScan's active India feed and filters/deduplicates Karnataka roles", async () => {
    const applyUrl = "https://careers.example.com/apply/intern";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        updated_at: "2026-10-28T00:00:00Z",
        jobs: [
          { title: "Software Engineering Intern", company: "Example Corp", locations: "India", city_tag: "Bengaluru", country: "India", category: "Software", posted: "2026-10-27", url: applyUrl },
          { title: "Duplicate Listing", company: "Example Corp", locations: "Bengaluru", city_tag: "Karnataka", url: applyUrl },
          { title: "Outside State", company: "Example Corp", locations: "Delhi", city_tag: "Delhi", url: "https://careers.example.com/delhi" },
        ],
      }),
    });

    const result = await handleInternshipsRequest({ region: "Karnataka" });
    expect(result.status).toBe(200);
    expect(result.body.internships).toHaveLength(1);
    expect(result.body.internships[0].title).toBe("Software Engineering Intern");
    expect(result.body.internships[0].applicationUrl).toBe(applyUrl);
    expect(global.fetch).toHaveBeenCalledWith("https://internscan.vercel.app/in/api/active.json", expect.anything());
  });

});
