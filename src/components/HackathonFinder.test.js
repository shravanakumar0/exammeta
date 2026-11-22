import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import HackathonFinder from "./HackathonFinder";
import { fetchAllHackathons, fetchInternships } from "../api/freeOpportunities";

jest.mock("../api/freeOpportunities", () => ({
  fetchAllHackathons: jest.fn(),
  fetchInternships: jest.fn(),
  formatDate: (value) => value ? new Date(value).toLocaleDateString("en-IN") : "TBD",
}));

const listings = [
  {
    id: "blr-event",
    title: "Bengaluru Buildathon",
    organizer: "Karnataka Tech Club",
    description: "Open to college students",
    location: "Bengaluru",
    mode: "In-person",
    registrationDeadline: "2026-12-01",
    registrationUrl: "https://events.example/blr",
    tags: ["HACKATHON"],
    provider: "Unstop",
    kind: "competition",
  },
  {
    id: "delhi-event",
    title: "Delhi Code Challenge",
    organizer: "Delhi Developers",
    location: "New Delhi",
    mode: "In-person",
    registrationDeadline: "2026-12-05",
    registrationUrl: "https://events.example/delhi",
    tags: ["HACKATHON"],
    provider: "Devfolio",
    kind: "competition",
  },
  {
    id: "online-event",
    title: "Online Student Sprint",
    organizer: "Student Network",
    location: "Online · India",
    mode: "Online",
    registrationDeadline: "2026-12-10",
    registrationUrl: "https://events.example/online",
    tags: ["HACKATHON"],
    provider: "MLH",
    kind: "competition",
  },
];

const renderFinder = () => render(
  <MemoryRouter>
    <HackathonFinder initialType="hackathons" showTabs={false} />
  </MemoryRouter>
);

describe("HackathonFinder", () => {
  beforeEach(() => {
    fetchAllHackathons.mockReset();
    fetchInternships.mockReset();
    fetchAllHackathons.mockResolvedValue({
      items: listings,
      total: 145,
      refreshedAt: "2026-11-20T08:00:00.000Z",
      attribution: "Free to use with attribution.",
    });
  });

  test("loads all hackathons automatically without a Find Hackathons button", async () => {
    renderFinder();

    expect(await screen.findByRole("heading", { name: "Bengaluru Buildathon" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Bengaluru Buildathon" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Online Student Sprint" })).toBeInTheDocument();
    expect(fetchAllHackathons).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Find Hackathons" })).not.toBeInTheDocument();
  });

  test("loads India-wide events by default and filters to Karnataka", async () => {
    renderFinder();
    await screen.findByRole("heading", { name: "Bengaluru Buildathon" });

    fireEvent.change(screen.getByLabelText("Search location"), {
      target: { value: "Karnataka" },
    });

    expect(screen.getByRole("heading", { name: "Bengaluru Buildathon" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Online Student Sprint" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Delhi Code Challenge" })).not.toBeInTheDocument();
  });

  test("loads internship listings automatically", async () => {
    fetchInternships.mockResolvedValue([
      {
        id: "internship-1",
        title: "Frontend Intern",
        organizer: "Student Systems",
        location: "Bengaluru",
        mode: "In-person",
        applicationUrl: "https://jobs.example/frontend",
      },
    ]);

    render(
      <MemoryRouter>
        <HackathonFinder initialType="internships" showTabs={false} />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Frontend Intern" })).toBeInTheDocument();
    expect(fetchInternships).toHaveBeenCalledWith("Karnataka", "");
  });
});
