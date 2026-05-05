import { useEffect, useMemo, useState } from "react";
import type { Route } from "./+types/home";

type TicketStatus = "open" | "in-progress" | "closed";
type TicketPriority = "low" | "medium" | "high";

type Ticket = {
  id: number;
  title: string;
  description: string;
  customerName: string;
  customerEmail: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
};

type CreateTicketForm = {
  title: string;
  description: string;
  priority: TicketPriority;
};

const API_BASE_URL = "http://localhost:3000";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Smart Support System" },
    { name: "description", content: "Smart support ticket dashboard" },
  ];
}

export default function Home() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [statusUpdating, setStatusUpdating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }

  }, []);

  useEffect(() => {
    void fetchTickets();
  }, []);

  const [formData, setFormData] = useState<CreateTicketForm>({
    title: "",
    description: "",
    priority: "medium",
  });

  async function fetchTickets() {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await fetch(`${API_BASE_URL}/tickets`);
      if (!response.ok) {
        throw new Error("Failed to fetch tickets.");
      }

      const data: Ticket[] = await response.json();
      setTickets(data);

      if (data.length > 0 && selectedTicketId === null) {
        setSelectedTicketId(data[0].id);
      }

      if (
        selectedTicketId !== null &&
        !data.some((ticket) => ticket.id === selectedTicketId)
      ) {
        setSelectedTicketId(data.length > 0 ? data[0].id : null);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchTickets();
  }, []);

  const selectedTicket =
    tickets.find((ticket) => ticket.id === selectedTicketId) ?? null;

  const recentTickets = useMemo(() => {
    return [...tickets]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5);
  }, [tickets]);

  const openTickets = useMemo(() => {
    return tickets.filter(
      (ticket) =>
        ticket.status === "open" || ticket.status === "in-progress"
    );
  }, [tickets]);

  const closedTickets = useMemo(() => {
    return tickets.filter((ticket) => ticket.status === "closed");
  }, [tickets]);

  function handleInputChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleCreateTicket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setErrorMessage("");

      const response = await fetch(`${API_BASE_URL}/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          customerName: currentUser?.name ?? "",
          customerEmail: currentUser?.email ?? "",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create ticket.");
      }

      const newTicket: Ticket = await response.json();

      const updatedTickets = [newTicket, ...tickets];
      setTickets(updatedTickets);
      setSelectedTicketId(newTicket.id);
      setShowCreateForm(false);

      setFormData({
        title: "",
        description: "",
        priority: "medium",
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(newStatus: TicketStatus) {
    if (!selectedTicket) {
      return;
    }

    try {
      setStatusUpdating(true);
      setErrorMessage("");

      const response = await fetch(
        `${API_BASE_URL}/tickets/${selectedTicket.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update ticket status.");
      }

      const updatedTicket: Ticket = await response.json();

      setTickets((currentTickets) =>
        currentTickets.map((ticket) =>
          ticket.id === updatedTicket.id ? updatedTicket : ticket
        )
      );
      setSelectedTicketId(updatedTicket.id);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setStatusUpdating(false);
    }
  }

  async function handleDeleteTicket() {
    if (!selectedTicket) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${selectedTicket.title}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setErrorMessage("");

      const response = await fetch(
        `${API_BASE_URL}/tickets/${selectedTicket.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete ticket.");
      }

      const remainingTickets = tickets.filter(
        (ticket) => ticket.id !== selectedTicket.id
      );

      setTickets(remainingTickets);
      setSelectedTicketId(
        remainingTickets.length > 0 ? remainingTickets[0].id : null
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleString();
  }

  function renderTicketButton(ticket: Ticket) {
    const isSelected = selectedTicketId === ticket.id;

    return (
      <button
        key={ticket.id}
        type="button"
        onClick={() => setSelectedTicketId(ticket.id)}
        className={`w-full rounded-xl border px-3 py-3 text-left transition ${
          isSelected
            ? "border-blue-600 bg-blue-50"
            : "border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-gray-900 truncate">
            {ticket.title}
          </span>
          <span className="text-xs uppercase text-gray-500">{ticket.status}</span>
        </div>
        <p className="mt-1 text-sm text-gray-600 truncate">
          {ticket.customerName}
        </p>
      </button>
    );
  }

  return (
    <main className="min-h-screen bg-slate-200 p-6">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)_260px]">
        <aside className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Smart Support
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Ticket dashboard
            </p>
          </div>
            {currentUser && (
              <div className="mt-2 mb-4">
                <p className="mt-1 text-sm text-gray-600">
                  Logged in as {currentUser.name} ({currentUser.email})
                </p>
                
                <button
                  onClick={() => {
                    localStorage.removeItem("currentUser");
                    window.location.href = "/";
                  }}
                  className="mt-4 w-2/3 rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            )}

          <button
            type="button"
            onClick={() => setShowCreateForm((current) => !current)}
            className="mb-6 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
          >
            {showCreateForm ? "Close Ticket Form" : "Create New Ticket"}
          </button>

          <div className="space-y-6">
            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
                Recent Tickets
              </h2>
              <div className="space-y-2">
                {recentTickets.length > 0 ? (
                  recentTickets.map(renderTicketButton)
                ) : (
                  <p className="text-sm text-gray-500">No recent tickets yet.</p>
                )}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
                Open Tickets
              </h2>
              <div className="space-y-2">
                {openTickets.length > 0 ? (
                  openTickets.map(renderTicketButton)
                ) : (
                  <p className="text-sm text-gray-500">No open tickets.</p>
                )}
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
                Closed Tickets
              </h2>
              <div className="space-y-2">
                {closedTickets.length > 0 ? (
                  closedTickets.map(renderTicketButton)
                ) : (
                  <p className="text-sm text-gray-500">No closed tickets.</p>
                )}
              </div>
            </section>
          </div>
        </aside>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          {showCreateForm ? (
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Create New Ticket
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Submit a support request through the form below.
              </p>
              {currentUser && (
                <p className="mt-2 text-sm text-gray-600">
                  Submitting as {currentUser.name} ({currentUser.email})
                </p>
              )}

              <form onSubmit={handleCreateTicket} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="title"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Title
                  </label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows={5}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>

                {/* commented out Name and Email for ticket form inputs - automatically submit using login credentials
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="customerName"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Name
                    </label>
                    <input
                      id="customerName"
                      name="customerName"
                      type="text"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="customerEmail"
                      className="mb-1 block text-sm font-medium text-gray-700"
                    >
                      Email
                    </label>
                    <input
                      id="customerEmail"
                      name="customerEmail"
                      type="email"
                      value={formData.customerEmail}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
                */}

                {/* commented out Priority - will add for Agents/Admins
                <div>
                  <label
                    htmlFor="priority"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                */}

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </button>
              </form>
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Main Ticket Details
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Select a ticket from the sidebar to view its details.
              </p>

              {loading ? (
                <p className="mt-6 text-gray-600">Loading tickets...</p>
              ) : selectedTicket ? (
                <div className="mt-6 space-y-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-3xl font-bold text-gray-900">
                        {selectedTicket.title}
                      </h3>
                      {/* removed Priority for UI - will add for Agents/Admins
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700">
                        {selectedTicket.priority} priority
                      </span>
                      */}
                    </div>

                    <p className="mt-2 text-sm text-gray-500">
                      Created {formatDate(selectedTicket.createdAt)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-100 p-5">
                    <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
                      Submitted By
                    </h4>
                    <p className="text-lg font-semibold text-gray-900">
                      {selectedTicket.customerName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedTicket.customerEmail}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-200 p-5">
                    <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
                      Description
                    </h4>
                    <p className="whitespace-pre-wrap text-gray-800">
                      {selectedTicket.description}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-100 p-5">
                    <h4 className="mb-2 text-sm font-bold uppercase tracking-wide text-gray-500">
                      Chat / Attachments
                    </h4>
                    <p className="text-sm text-gray-600">
                      Not implemented yet in the backend.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-6 text-gray-600">
                  No ticket selected yet. Create one to get started.
                </p>
              )}
            </div>
          )}

          {errorMessage ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}
        </section>

        <aside className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Ticket Info</h2>

          {selectedTicket ? (
            <div className="mt-5 space-y-4 text-sm">
              <div>
                <p className="font-semibold text-gray-500">Date Created</p>
                <p className="mt-1 text-gray-900">
                  {formatDate(selectedTicket.createdAt)}
                </p>
              </div>

              <div>
                <p className="font-semibold text-gray-500">User Email</p>
                <p className="mt-1 break-all text-gray-900">
                  {selectedTicket.customerEmail}
                </p>
              </div>

              <div>
                <p className="font-semibold text-gray-500">User Name</p>
                <p className="mt-1 text-gray-900">
                  {selectedTicket.customerName}
                </p>
              </div>

              <div>
                <p className="font-semibold text-gray-500">Priority</p>
                <p className="mt-1 capitalize text-gray-900">
                  {selectedTicket.priority}
                </p>
              </div>

              <div>
                <label
                  htmlFor="ticketStatus"
                  className="mb-1 block font-semibold text-gray-500"
                >
                  Ticket Status
                </label>
                <select
                  id="ticketStatus"
                  value={selectedTicket.status}
                  disabled={statusUpdating}
                  onChange={(event) =>
                    void handleStatusChange(event.target.value as TicketStatus)
                  }
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => void handleDeleteTicket()}
                className="w-full rounded-xl bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700"
              >
                Delete Ticket
              </button>
            </div>
          ) : (
            <p className="mt-5 text-sm text-gray-600">
              Select a ticket to view its details.
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}