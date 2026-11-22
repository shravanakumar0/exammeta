import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import {
  getCurrentUser,
  getProfile,
  getHackathonRegistrations,
  updateHackathonSubmission,
  deleteHackathonSubmission,
  signOut,
} from '../supabaseClient';

jest.mock('./ResourceManager', () => () => null);
jest.mock('./DiscussionManager', () => () => null);

jest.mock('../supabaseClient', () => ({
  getCurrentUser: jest.fn(),
  getProfile: jest.fn(),
  getHackathonRegistrations: jest.fn(),
  updateHackathonSubmission: jest.fn(),
  deleteHackathonSubmission: jest.fn(),
  signOut: jest.fn(),
}));

const submission = {
  id: 'submission-1',
  name: 'Campus Buildathon',
  organizer: 'Tech Club',
  contact_email: 'tech@example.edu',
  description: 'A student event for building useful campus projects.',
  location: 'Bengaluru',
  mode: 'Offline',
  registration_deadline: '2026-12-10',
  event_date: '2026-12-20',
  registration_url: 'https://example.edu/register',
  tech_tags: ['Web Development'],
  status: 'pending',
  created_at: '2026-11-20T10:00:00.000Z',
};

describe('AdminDashboard', () => {
  beforeEach(() => {
    getCurrentUser.mockResolvedValue({ id: 'admin-1' });
    getProfile.mockResolvedValue({
      data: { role: 'admin', is_active: true },
      error: null,
    });
    getHackathonRegistrations.mockResolvedValue({
      data: [submission],
      error: null,
    });
    updateHackathonSubmission.mockResolvedValue({
      data: { ...submission, status: 'approved' },
      error: null,
    });
  });

  test('shows submissions to an active admin and approves one', async () => {
    render(<MemoryRouter><AdminDashboard /></MemoryRouter>);

    expect(await screen.findByText('Campus Buildathon')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Approve/ }));

    await waitFor(() => {
      expect(updateHackathonSubmission).toHaveBeenCalledWith(
        'submission-1',
        'approved',
        '',
        true
      );
    });
  });

  test('rejects a pending submission', async () => {
    updateHackathonSubmission.mockResolvedValueOnce({
      data: { ...submission, status: 'rejected' },
      error: null,
    });
    render(<MemoryRouter><AdminDashboard /></MemoryRouter>);

    expect(await screen.findByText('Campus Buildathon')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Reject/ }));

    await waitFor(() => {
      expect(updateHackathonSubmission).toHaveBeenCalledWith(
        'submission-1',
        'rejected',
        '',
        true
      );
    });
  });

  test('shows access denial to a student', async () => {
    getProfile.mockResolvedValue({
      data: { role: 'student', is_active: true },
      error: null,
    });
    render(<MemoryRouter><AdminDashboard /></MemoryRouter>);

    expect(await screen.findByRole('heading', { name: 'Admin access required' })).toBeInTheDocument();
    expect(getHackathonRegistrations).not.toHaveBeenCalled();
  });
});
