import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HackathonRegistration from './HackathonRegistration';
import { registerForHackathon } from '../supabaseClient';

jest.mock('../supabaseClient', () => ({
  registerForHackathon: jest.fn(),
}));

const fillRequiredFields = () => {
  const fields = [
    [/Hackathon Name/, 'Campus Innovation Hackathon'],
    [/Organizer Name/, 'CSE Department'],
    [/Contact Email/, 'organizer@example.edu'],
    [/Location/, 'Bengaluru, Karnataka'],
    [/Registration Deadline/, '2026-12-20'],
    [/Event Date/, '2026-12-30'],
    [/Primary Domain/, 'AI / Machine Learning'],
    [/Description/, 'A campus hackathon focused on practical student projects.'],
    [/Registration URL/, 'https://example.edu/register'],
  ];

  fields.forEach(([label, value]) => {
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  });
  fireEvent.click(screen.getByLabelText(/I agree to the Terms and Conditions/));
};

const renderForm = () => render(
  <MemoryRouter>
    <HackathonRegistration />
  </MemoryRouter>
);

describe('HackathonRegistration', () => {
  beforeEach(() => {
    registerForHackathon.mockReset();
  });

  test('submits the schema-compatible event details and confirms review status', async () => {
    registerForHackathon.mockResolvedValue({ data: { id: 'submission-id' }, error: null });
    renderForm();
    fillRequiredFields();
    fireEvent.change(screen.getByLabelText(/Registration Opens/), {
      target: { value: '2026-12-01' },
    });
    fireEvent.change(screen.getByLabelText(/Prizes/), {
      target: { value: 'Scholarships and prizes' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Submit Hackathon/ }));

    await waitFor(() => {
      expect(registerForHackathon).toHaveBeenCalledWith({
        name: 'Campus Innovation Hackathon',
        organizer: 'CSE Department',
        contact_email: 'organizer@example.edu',
        registration_start_date: '2026-12-01',
        registration_deadline: '2026-12-20',
        event_date: '2026-12-30',
        location: 'Bengaluru, Karnataka',
        mode: 'Online',
        tech_tags: ['AI / Machine Learning'],
        description: 'A campus hackathon focused on practical student projects.',
        registration_url: 'https://example.edu/register',
        poster_url: null,
        prizes: 'Scholarships and prizes',
      });
    });
    expect(await screen.findByRole('heading', { name: 'Hackathon Submitted' })).toBeInTheDocument();
  });

  test('shows the server error instead of a success screen when submission fails', async () => {
    registerForHackathon.mockResolvedValue({
      data: null,
      error: { message: 'Submission permission denied' },
    });
    renderForm();
    fillRequiredFields();

    fireEvent.click(screen.getByRole('button', { name: /Submit Hackathon/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Submission permission denied');
    expect(screen.queryByRole('heading', { name: 'Hackathon Submitted' })).not.toBeInTheDocument();
  });
});
