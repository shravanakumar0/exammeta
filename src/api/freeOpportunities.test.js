import { fetchAllHackathons } from "./freeOpportunities";
import { getApprovedHackathons } from "../supabaseClient";

jest.mock("../supabaseClient", () => ({
  getApprovedHackathons: jest.fn(),
}));

const originalFetch = global.fetch;

describe("fetchAllHackathons", () => {
  beforeEach(() => {
    getApprovedHackathons.mockResolvedValue({ data: [], error: null });
  });

  afterEach(() => {
    if (originalFetch === undefined) delete global.fetch;
    else global.fetch = originalFetch;
  });

  test("loads free-source hackathons through the same-origin API and normalizes its fields", async () => {
    const listing = {
      id: "unstop-123",
      title: "Campus Code Sprint",
      organizer: "Student Tech Club",
      eventUrl: "https://unstop.com/competitions/campus-code-sprint",
      registrationUrl: "https://unstop.com/competitions/campus-code-sprint",
      startDate: "2026-12-01",
      mode: "Online",
      location: "Online · India",
      provider: "Unstop",
      registrationCount: 120,
    };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        searchedAt: "2026-11-20T08:00:00.000Z",
        events: [listing],
      }),
    });

    const result = await fetchAllHackathons();

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/^\/api\/hackathons\?region=India&t=\d+$/),
      expect.objectContaining({ method: "GET" })
    );
    expect(result).toMatchObject({
      total: 1,
      items: [{
        id: "unstop-123",
        organizer: "Student Tech Club",
        location: "Online · India",
        mode: "Online",
        startDate: listing.startDate,
        registrationUrl: listing.registrationUrl,
        registrationCount: 120,
      }],
    });
  });

  test("includes approved community submissions and removes expired deadlines", async () => {
    getApprovedHackathons.mockResolvedValueOnce({
      data: [
        {
          id: "approved-1",
          name: "Student Buildathon",
          organizer: "ExamMeta Club",
          description: "Build useful tools for students.",
          location: "Bengaluru",
          mode: "Offline",
          registration_deadline: "2026-12-10",
          event_date: "2026-12-20",
          registration_url: "https://example.edu/buildathon",
          tech_tags: ["Web Development"],
          prizes: "Certificates",
        },
        {
          id: "expired-1",
          name: "Expired Buildathon",
          organizer: "ExamMeta Club",
          description: "This event is no longer accepting registrations.",
          location: "Online",
          mode: "Online",
          registration_deadline: "2020-01-01",
          event_date: "2020-01-10",
          registration_url: "https://example.edu/expired",
        },
      ],
      error: null,
    });
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ events: [] }),
    });

    const result = await fetchAllHackathons();

    expect(result.items).toEqual([
      expect.objectContaining({
        id: "community-approved-1",
        title: "Student Buildathon",
        provider: "ExamMeta community",
      }),
    ]);
  });
});
