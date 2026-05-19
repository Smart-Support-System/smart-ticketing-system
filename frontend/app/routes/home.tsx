import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import type { Route } from "./+types/home";

// Added ticket chat functionality import
import TicketChat from "../components/TicketChat";
import { API_BASE_URL } from "~/root";

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
  chatStarted: boolean;
};

type AppUser = {
  user_id: number;
  email: string;
  name: string;
  is_approved: boolean;
  role: "user" | "agent" | "admin";
};

type CreateTicketForm = {
  title: string;
  description: string;
  priority: TicketPriority;
};

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
  const [priorityUpdating, setPriorityUpdating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false);
  const [expandedSections, setExpandedSections] = useState({
    recent: false,
    open: false,
    closed: false,
  });
  const [activeView, setActiveView] = useState<"dashboard" | "archived" | "users">("dashboard");
  const [archivedTickets, setArchivedTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [adminLoading, setAdminLoading] = useState<boolean>(false);
  const [selectedStatuses, setSelectedStatuses] = useState<Set<TicketStatus>>(
    new Set(["open", "in-progress", "closed"])
  );
  const [selectedPriorities, setSelectedPriorities] = useState<Set<TicketPriority>>(
    new Set(["low", "medium", "high"])
  );
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalTickets, setTotalTickets] = useState<number>(0);
  const [hasMoreTickets, setHasMoreTickets] = useState<boolean>(false);
  const [archivedPage, setArchivedPage] = useState<number>(0);
  const [archivedPageSize, setArchivedPageSize] = useState<number>(10);
  const [totalArchivedTickets, setTotalArchivedTickets] = useState<number>(0);
  const [archivedHasMore, setArchivedHasMore] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');

  useEffect(() => {
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }

  }, []);

  useEffect(() => {
    void fetchTickets();
  }, [currentPage, pageSize]);

  const [formData, setFormData] = useState<CreateTicketForm>({
    title: "",
    description: "",
    priority: "medium",
  });

  async function fetchTickets() {
    try {
      setLoading(true);
      setErrorMessage("");

      const offset = currentPage * pageSize;
      const response = await fetch(
        `${API_BASE_URL}/tickets?offset=${offset}&limit=${pageSize}`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch tickets.");
      }

      const data = await response.json();

      const ticketList = Array.isArray(data) ? data : data.data || [];
      setTickets(ticketList);

      if (data.total !== undefined) {
        setTotalTickets(data.total);
        setHasMoreTickets(data.hasMore);
      } else {
        setTotalTickets(ticketList.length);
        setHasMoreTickets(false);
      }

      if (ticketList.length > 0 && selectedTicketId === null) {
        setSelectedTicketId(ticketList[0].id);
      }

      if (
        selectedTicketId !== null &&
        !ticketList.some((ticket: any) => ticket.id === selectedTicketId)
      ) {
        setSelectedTicketId(ticketList.length > 0 ? ticketList[0].id : null);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  const selectedTicket =
    tickets.find((ticket) => ticket.id === selectedTicketId) ?? null;

  const isStaff =
    currentUser?.role === "agent" || currentUser?.role === "admin";

  const isAdmin = currentUser?.role === "admin";

  const isNormalUser = currentUser?.role === "user";

  const recentTickets = useMemo(() => {
    return [...tickets]
      .filter(
        (ticket) =>
          selectedStatuses.has(ticket.status) &&
          selectedPriorities.has(ticket.priority) &&
          (ticket.title.includes(searchText) ||
            ticket.description.includes(searchText))
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 5);
  }, [tickets, selectedStatuses, selectedPriorities, searchText]);

  const openTickets = useMemo(() => {
    return tickets.filter(
      (ticket) =>
        (ticket.status === "open" || ticket.status === "in-progress") &&
        selectedStatuses.has(ticket.status) &&
        selectedPriorities.has(ticket.priority) &&
        (ticket.title.includes(searchText) ||
          ticket.description.includes(searchText))
    );
  }, [tickets, selectedStatuses, selectedPriorities, searchText]);

  const closedTickets = useMemo(() => {
    return tickets.filter(
      (ticket) =>
        ticket.status === "closed" &&
        selectedStatuses.has(ticket.status) &&
        selectedPriorities.has(ticket.priority) &&
        (ticket.title.includes(searchText) ||
          ticket.description.includes(searchText))
    );
  }, [tickets, selectedStatuses, selectedPriorities, searchText]);

  function handleInputChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function toggleSection(section: "recent" | "open" | "closed") {
    setExpandedSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  }

  function toggleStatusFilter(status: TicketStatus) {
    setSelectedStatuses((current) => {
      const updated = new Set(current);
      if (updated.has(status)) {
        updated.delete(status);
      } else {
        updated.add(status);
      }
      return updated;
    });
  }

  function togglePriorityFilter(priority: TicketPriority) {
    setSelectedPriorities((current) => {
      const updated = new Set(current);
      if (updated.has(priority)) {
        updated.delete(priority);
      } else {
        updated.add(priority);
      }
      return updated;
    });
  }

  async function fetchArchivedTickets() {
    try {
      setAdminLoading(true);
      setErrorMessage("");

      const offset = archivedPage * archivedPageSize;
      const response = await fetch(
        `${API_BASE_URL}/tickets/archived?offset=${offset}&limit=${archivedPageSize}`,
        {
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch archived tickets.");
      }

      const data = await response.json();

      const ticketList = Array.isArray(data) ? data : data.data || [];
      setArchivedTickets(ticketList);

      if (data.total !== undefined) {
        setTotalArchivedTickets(data.total);
        setArchivedHasMore(data.hasMore);
      } else {
        setTotalArchivedTickets(ticketList.length);
        setArchivedHasMore(false);
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setAdminLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      setAdminLoading(true);
      setErrorMessage("");

      const response = await fetch(`${API_BASE_URL}/users`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users.");
      }

      const data: AppUser[] = await response.json();
      setUsers(data);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setAdminLoading(false);
    }
  }

  async function handleOpenArchivedTickets() {
    setActiveView("archived");
    setArchivedPage(0);
    await fetchArchivedTickets();
  }

  useEffect(() => {
    if (activeView === "archived") {
      void fetchArchivedTickets();
    }
  }, [archivedPage, archivedPageSize, activeView]);

  async function handleOpenUserManagement() {
    setActiveView("users");
    await fetchUsers();
  }

  async function handlePermanentDeleteTicket(ticket: Ticket) {
    const confirmed = window.confirm(
      `Are you sure you want to delete Ticket (ID: ${ticket.id})?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setErrorMessage("");

      const response = await fetch(`${API_BASE_URL}/tickets/${ticket.id}/permanent`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to permanently delete ticket.");
      }

      setArchivedTickets((current) =>
        current.filter((archivedTicket) => archivedTicket.id !== ticket.id)
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    }
  }

  async function handleRoleChange(user: AppUser, newRole: "user" | "agent" | "admin") {
    const confirmed = window.confirm(
      `Are you sure you want '${user.name} (User ID: ${user.user_id})' to be set to '${newRole.toUpperCase()}'?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setErrorMessage("");

      const response = await fetch(`${API_BASE_URL}/users/${user.user_id}/role`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error("Failed to update user role.");
      }

      const updatedUser: AppUser = await response.json();

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.user_id === updatedUser.user_id ? updatedUser : currentUser
        )
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    }
  }

  async function handleDeleteUser(user: AppUser) {
    const confirmed = window.confirm(
      `Are you sure you want to DELETE '${user.name} (User ID: ${user.user_id})'?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setErrorMessage("");

      const response = await fetch(`${API_BASE_URL}/users/${user.user_id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete user.");
      }

      setUsers((currentUsers) =>
        currentUsers.filter((currentUser) => currentUser.user_id !== user.user_id)
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    }
  }

  async function handleCreateTicket(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setSubmitting(true);
      setErrorMessage("");

      const response = await fetch(`${API_BASE_URL}/tickets`, {
        method: "POST",
        credentials: "include",
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

      setTotalTickets((prev) => prev + 1);
      setCurrentPage(0);
      setShowCreateForm(false);

      setFormData({
        title: "",
        description: "",
        priority: "medium",
      });

      await fetchTickets();
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
          credentials: "include",
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

  async function handlePriorityChange(newPriority: TicketPriority) {
    if (!selectedTicket) {
      return;
    }

    try {
      setPriorityUpdating(true);
      setErrorMessage("");

      const response = await fetch(
        `${API_BASE_URL}/tickets/${selectedTicket.id}/priority`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ priority: newPriority }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update ticket priority.");
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
      setPriorityUpdating(false);
    }
  }

  async function handleDeleteTicket() {
    if (!selectedTicket) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to archive "${selectedTicket.title}"?`
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
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to archive ticket.");
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

  function handleSearchChange(e: ChangeEvent<HTMLInputElement>) {
    setSearchText(e.target.value);
  }

  return (
    <main className="min-h-screen bg-slate-200 p-6">
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:auto-rows-max">
        <aside className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-sm lg:row-span-2">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Smart Support
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Ticket dashboard
            </p>
          </div>

          {isNormalUser ? (
            <button
              type="button"
              onClick={() => setShowCreateForm((current) => !current)}
              className="mb-6 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
            >
              {showCreateForm ? "Close Ticket Form" : "Create New Ticket"}
            </button>
          ) : null}

          <div className="mb-6 rounded-xl bg-slate-50 p-4">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-gray-500">
              Filters
            </h3>

            <input
              type="search"
              value={searchText}
              onChange={handleSearchChange}
              required
              className="w-full rounded-xl border border-gray-300 px-4 py-2 mb-2 outline-none focus:border-blue-500"
            />

            <div className="mb-4">
              <p className="mb-2 text-xs font-semibold text-gray-600">Status</p>
              <div className="space-y-2">
                {["open", "in-progress", "closed"].map((status) => (
                  <label key={status} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedStatuses.has(status as TicketStatus)}
                      onChange={() => toggleStatusFilter(status as TicketStatus)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 capitalize">{status}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-gray-600">Priority</p>
              <div className="space-y-2">
                {["low", "medium", "high"].map((priority) => (
                  <label key={priority} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedPriorities.has(priority as TicketPriority)}
                      onChange={() => togglePriorityFilter(priority as TicketPriority)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700 capitalize">{priority}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <section>
              <button
                type="button"
                onClick={() => toggleSection("recent")}
                className="mb-3 flex w-full items-center justify-between rounded-xl bg-slate-100 px-3 py-2 text-left text-sm font-bold uppercase tracking-wide text-gray-500 hover:bg-slate-200"
              >
                <span>Recent Tickets ({recentTickets.length})</span>
                <span>{expandedSections.recent ? "−" : "+"}</span>
              </button>

              {expandedSections.recent ? (
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {recentTickets.length > 0 ? (
                    recentTickets.map(renderTicketButton)
                  ) : (
                    <p className="text-sm text-gray-500">No recent tickets yet.</p>
                  )}
                </div>
              ) : null}
            </section>

            <section>
              <button
                type="button"
                onClick={() => toggleSection("open")}
                className="mb-3 flex w-full items-center justify-between rounded-xl bg-slate-100 px-3 py-2 text-left text-sm font-bold uppercase tracking-wide text-gray-500 hover:bg-slate-200"
              >
                <span>Open Tickets ({openTickets.length})</span>
                <span>{expandedSections.open ? "−" : "+"}</span>
              </button>

              {expandedSections.open ? (
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {openTickets.length > 0 ? (
                    openTickets.map(renderTicketButton)
                  ) : (
                    <p className="text-sm text-gray-500">No open tickets.</p>
                  )}
                </div>
              ) : null}
            </section>

            <section>
              <button
                type="button"
                onClick={() => toggleSection("closed")}
                className="mb-3 flex w-full items-center justify-between rounded-xl bg-slate-100 px-3 py-2 text-left text-sm font-bold uppercase tracking-wide text-gray-500 hover:bg-slate-200"
              >
                <span>Closed Tickets ({closedTickets.length})</span>
                <span>{expandedSections.closed ? "−" : "+"}</span>
              </button>

              {expandedSections.closed ? (
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {closedTickets.length > 0 ? (
                    closedTickets.map(renderTicketButton)
                  ) : (
                    <p className="text-sm text-gray-500">No closed tickets.</p>
                  )}
                </div>
              ) : null}
            </section>
          </div>
          {isAdmin ? (
            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => void handleOpenArchivedTickets()}
                className="w-full rounded-xl bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700"
              >
                View Archived Tickets
              </button>

              <button
                type="button"
                onClick={() => void handleOpenUserManagement()}
                className="w-full rounded-xl bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700"
              >
                Manage Users
              </button>

              {activeView !== "dashboard" ? (
                <button
                  type="button"
                  onClick={() => setActiveView("dashboard")}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Back to Dashboard
                </button>
              ) : null}
            </div>
          ) : null}

          <div className="mt-6">
            {currentUser && (
              <div>
                <p className="text-sm text-gray-600">
                  Logged in as {currentUser.name} ({currentUser.email})
                </p>

                <button
                  onClick={() => {
                    localStorage.removeItem("currentUser");
                    window.location.href = "/";
                  }}
                  className="mt-2 w-2/3 rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </aside>

        <section className="rounded-2xl bg-white p-6 shadow-sm max-h-100 overflow-y-auto">
          {activeView === "archived" ? (
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Archived Tickets
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Permanently delete archived tickets from the system.
              </p>

              {adminLoading ? (
                <p className="mt-6 text-gray-600">Loading archived tickets...</p>
              ) : archivedTickets.length > 0 ? (
                <div>
                  <div className="mt-6 space-y-3">
                    {archivedTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="rounded-2xl border border-gray-200 p-4"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              Ticket ID: {ticket.id} — {ticket.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Submitted by {ticket.customerName} ({ticket.customerEmail})
                            </p>
                            <p className="text-sm text-gray-600">
                              Priority: {ticket.priority} | Status: {ticket.status}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => void handlePermanentDeleteTicket(ticket)}
                            className="rounded-xl bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700"
                          >
                            Delete Permanently
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-3">
                    <div className="text-sm text-gray-600">
                      Showing {archivedPage * archivedPageSize + 1} to {Math.min((archivedPage + 1) * archivedPageSize, totalArchivedTickets)} of {totalArchivedTickets}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setArchivedPage(Math.max(0, archivedPage - 1))}
                        disabled={archivedPage === 0}
                        className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        onClick={() => setArchivedPage(archivedPage + 1)}
                        disabled={!archivedHasMore}
                        className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-6 text-gray-600">No archived tickets found.</p>
              )}
            </div>
          ) : activeView === "users" ? (
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                User Management
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Grant, resign, or delete users.
              </p>

              {adminLoading ? (
                <p className="mt-6 text-gray-600">Loading users...</p>
              ) : users.length > 0 ? (
                <div className="mt-6 space-y-3">
                  {users.map((user) => (
                    <div
                      key={user.user_id}
                      className="rounded-2xl border border-gray-200 p-4"
                    >
                      <div className="grid gap-4 md:grid-cols-[1fr_180px_120px] md:items-center">
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {user.name} (User ID: {user.user_id})
                          </h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-sm text-gray-600">
                            Current role: {user.role}
                          </p>
                        </div>

                        <select
                          value={user.role}
                          onChange={(event) =>
                            void handleRoleChange(
                              user,
                              event.target.value as "user" | "agent" | "admin"
                            )
                          }
                          className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500"
                        >
                          <option value="user">Normal User</option>
                          <option value="agent">Agent</option>
                          <option value="admin">Admin</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => void handleDeleteUser(user)}
                          disabled={user.user_id === currentUser?.user_id}
                          className="rounded-xl bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300"
                        >
                          Delete User
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-6 text-gray-600">No users found.</p>
              )}
            </div>
          ) : showCreateForm && isNormalUser ? (
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
                Tickets
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                View and manage tickets for this page.
              </p>

              {loading ? (
                <p className="mt-6 text-gray-600">Loading tickets...</p>
              ) : tickets.length > 0 ? (
                <div>
                  <div className="mt-6 space-y-3">
                    {tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="rounded-2xl border border-gray-200 p-4 cursor-pointer hover:bg-gray-50 transition"
                        onClick={() => setSelectedTicketId(ticket.id)}
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900">
                              {ticket.title}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Submitted by {ticket.customerName} ({ticket.customerEmail})
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              Priority: <span className="capitalize font-semibold">{ticket.priority}</span> | Status: <span className="capitalize font-semibold">{ticket.status}</span>
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              Created {formatDate(ticket.createdAt)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`inline-block px-3 py-1 rounded-lg text-sm font-semibold ${
                              ticket.status === 'closed' ? 'bg-gray-200 text-gray-800' :
                              ticket.status === 'in-progress' ? 'bg-yellow-200 text-yellow-800' :
                              'bg-blue-200 text-blue-800'
                            }`}>
                              {ticket.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-3">
                    <div className="text-sm text-gray-600">
                      Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalTickets)} of {totalTickets}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                        disabled={currentPage === 0}
                        className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={!hasMoreTickets}
                        className="rounded-xl border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-6 text-gray-600">
                  No tickets found. Create one to get started.
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

        <aside className="rounded-2xl bg-white p-5 shadow-sm overflow-y-auto">
          <h2 className="text-xl font-bold text-gray-900">Ticket Info</h2>

          {selectedTicket ? (
            <div className="mt-5 space-y-4 text-sm">
              <div>
                <p className="font-semibold text-gray-500">Ticket ID</p>
                <p className="mt-1 text-gray-900">#{selectedTicket.id}</p>
              </div>

              <div>
                <p className="font-semibold text-gray-500">Title</p>
                <p className="mt-1 text-gray-900 font-medium">{selectedTicket.title}</p>
              </div>

              <div>
                <p className="font-semibold text-gray-500">Description</p>
                <p className="mt-1 text-gray-900 whitespace-pre-wrap text-xs">
                  {selectedTicket.description}
                </p>
              </div>

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

                {isStaff ? (
                  <select
                    id="ticketPriority"
                    value={selectedTicket.priority}
                    disabled={priorityUpdating}
                    onChange={(event) =>
                      void handlePriorityChange(event.target.value as TicketPriority)
                    }
                    className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 disabled:bg-gray-100"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                ) : (
                  <p className="mt-1 capitalize text-gray-900">
                    {selectedTicket.priority}
                  </p>
                )}
              </div>

              <div>
                <p className="font-semibold text-gray-500">Ticket Status</p>

                {isStaff ? (
                  <select
                    id="ticketStatus"
                    value={selectedTicket.status}
                    disabled={statusUpdating}
                    onChange={(event) =>
                      void handleStatusChange(event.target.value as TicketStatus)
                    }
                    className="mt-1 w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:border-blue-500 disabled:bg-gray-100"
                  >
                    <option value="open">Open</option>
                    <option value="in-progress">In Progress</option>
                    <option value="closed">Closed</option>
                  </select>
                ) : (
                  <p className="mt-1 capitalize text-gray-900">
                    {selectedTicket.status}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t">
                <p className="font-semibold text-gray-500 mb-3">Chat</p>
                <TicketChat
                  ticket={selectedTicket}
                  currentUser={currentUser}
                />
              </div>

              {isStaff ? (
                <button
                  type="button"
                  onClick={() => void handleDeleteTicket()}
                  className="w-full rounded-xl bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700"
                >
                  Archive Ticket
                </button>
              ) : null}
            </div>
          ) : (
            <p className="mt-5 text-sm text-gray-600">
              Select a ticket from the list to view its details.
            </p>
          )}
        </aside>
      </div>
    </main>
  );
}
