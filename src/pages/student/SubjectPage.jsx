import React, { useState } from "react";
import { Link } from "react-router-dom";

const SubjectPage = () => {
  const [activeTab, setActiveTab] = useState("all");

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* Top Navbar */}
      <nav className="navbar navbar-expand-lg bg-white border-bottom shadow-sm">
        <div className="container-fluid">
          <span className="navbar-brand fw-bold text-primary d-flex align-items-center gap-2">
            🎓 SECT Student Portal
          </span>

          <form className="d-flex mx-auto" style={{ width: "38%" }}>
            <input
              className="form-control rounded-pill px-4"
              type="search"
              placeholder="Search subjects..."
            />
          </form>

          <div className="dropdown">
            <button
              className="btn btn-light rounded-pill px-3 d-flex align-items-center gap-2 shadow-sm"
              data-bs-toggle="dropdown"
            >
              <span
                className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: 32, height: 32 }}
              >
                A
              </span>
              <span className="fw-semibold">Alex</span>
              <i className="bi bi-chevron-down small"></i>
            </button>

            <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0">
                          <li>
                            <Link className="dropdown-item" to="/student/profile">
                              My Profile
                            </Link>
                          </li>
                          <li><hr className="dropdown-divider" /></li>
                          <li>
                            <Link className="dropdown-item text-danger" to="/">
                              Logout
                            </Link>
                          </li>
                        </ul>
          </div>
        </div>
      </nav>

      <div className="d-flex flex-grow-1">
        {/* Sidebar */}
        <nav
          className="bg-white border-end shadow-sm"
          style={{ width: "110px", minHeight: "100%" }}
        >
          <ul className="nav flex-column p-3 align-items-center gap-2">
            <li className="nav-item w-100">
              <Link
                to="/student"
                className="nav-link text-dark fw-semibold d-flex flex-column align-items-center py-3 rounded-4"
              >
                <i className="bi bi-speedometer2 fs-4 mb-1"></i>
                <span>Home</span>
              </Link>
            </li>

            <li className="nav-item w-100">
              <Link
                to="/student/subjects"
                className="nav-link active bg-primary text-white rounded-4 fw-semibold d-flex flex-column align-items-center py-3 shadow-sm"
              >
                <i className="bi bi-journal-bookmark fs-4 mb-1"></i>
                <span>Subjects</span>
              </Link>
            </li>

            <li className="nav-item mb-100">
              <Link
                className="nav-link text-black fw-semibold d-flex flex-column align-items-center py-3"
                to="/student/tasks"
              >
                <i className="bi bi-pencil-square fs-3 mb-1"></i>
                <span>Tasks</span>
              </Link>
            </li>

            <li className="nav-item w-100">
              <Link
                className="nav-link text-dark fw-semibold d-flex flex-column align-items-center py-3 rounded-4"
                to="/student/grades"
              >
                <i className="bi bi-graph-up-arrow fs-4 mb-1"></i>
                <span>Grades</span>
              </Link>
            </li>

            <li className="nav-item w-100">
              <Link
                className="nav-link text-dark fw-semibold d-flex flex-column align-items-center py-3 rounded-4"
                to="/student/account-settings"
              >
                <i className="bi bi-gear fs-4 mb-1"></i>
                <span>Settings</span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* Main */}
        <div className="flex-grow-1 p-4">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="fw-bold mb-1">📚 My Subjects</h4>
              <small className="text-muted">Fall Semester 2025 • Enrolled</small>
            </div>

            <div className="d-flex gap-2">
              <input
                className="form-control form-control-sm rounded-pill px-3"
                style={{ width: 220 }}
                placeholder="Search curriculum..."
              />
              <button className="btn btn-sm btn-outline-primary rounded-pill">
                <i className="bi bi-plus-circle me-1"></i>
                Browse Catalog
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="d-flex align-items-center gap-4 border-bottom mb-4">
            <button
              onClick={() => setActiveTab("all")}
              className={`btn btn-sm btn-link fw-semibold text-decoration-none rounded-0 ${
                activeTab === "all"
                  ? "text-primary border-bottom border-2 border-primary"
                  : "text-muted"
              }`}
            >
              All Subjects
            </button>
            <button
              onClick={() => setActiveTab("progress")}
              className={`btn btn-sm btn-link fw-semibold text-decoration-none rounded-0 ${
                activeTab === "progress"
                  ? "text-primary border-bottom border-2 border-primary"
                  : "text-muted"
              }`}
            >
              In Progress
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`btn btn-sm btn-link fw-semibold text-decoration-none rounded-0 ${
                activeTab === "completed"
                  ? "text-primary border-bottom border-2 border-primary"
                  : "text-muted"
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setActiveTab("archived")}
              className={`btn btn-sm btn-link fw-semibold text-decoration-none rounded-0 ${
                activeTab === "archived"
                  ? "text-primary border-bottom border-2 border-primary"
                  : "text-muted"
              }`}
            >
              Archived
            </button>

            <div className="ms-auto d-flex gap-2">
              <button className="btn btn-sm btn-light rounded-circle">
                <i className="bi bi-list"></i>
              </button>
              <button className="btn btn-sm btn-light rounded-circle">
                <i className="bi bi-grid"></i>
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="tab-content">
            {/* ALL SUBJECTS */}
            {activeTab === "all" && (
              <div className="row g-4">
                {/* Card 1 */}
                <div className="col-md-6 col-lg-4 col-xl-3">
                  <div className="card border-0 shadow-sm rounded-4 h-100">
                    <div
                      className="rounded-top-4 p-4 text-center position-relative"
                      style={{ background: "linear-gradient(135deg, #eef2ff, #ffffff)" }}
                    >
                      <div
                        className="bg-white rounded-4 shadow-sm d-inline-flex align-items-center justify-content-center mb-2"
                        style={{ width: 52, height: 52 }}
                      >
                        <i className="bi bi-code-slash fs-3 text-primary"></i>
                      </div>
                      <span className="badge bg-primary-subtle text-primary position-absolute top-0 end-0 m-2">
                        CS-101
                      </span>
                    </div>

                    <div className="card-body d-flex flex-column">
                      <span className="text-uppercase text-muted small fw-semibold">
                        Computer Science
                      </span>
                      <h6 className="fw-bold mb-1 mt-1">
                        Data Structures & Algorithms
                      </h6>
                      <p className="small text-muted mb-3">
                        Master arrays, trees, graphs, and advanced problem solving.
                      </p>

                      <div className="mt-auto">
                        <div className="d-flex justify-content-between small text-muted mb-1">
                          <span>Progress</span>
                          <span className="fw-semibold text-dark">45%</span>
                        </div>
                        <div className="progress mb-3" style={{ height: 6 }}>
                          <div
                            className="progress-bar bg-primary"
                            style={{ width: "45%" }}
                          ></div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center border-top pt-3">
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="bg-secondary-subtle rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: 26, height: 26 }}
                            >
                              <i className="bi bi-person-fill text-secondary"></i>
                            </div>
                            <small className="text-muted">Prof. Smith</small>
                          </div>
                          <button className="btn btn-sm btn-light rounded-circle">
                            <i className="bi bi-arrow-right"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="col-md-6 col-lg-4 col-xl-3">
                  <div className="card border-0 shadow-sm rounded-4 h-100">
                    <div
                      className="rounded-top-4 p-4 text-center position-relative"
                      style={{ background: "linear-gradient(135deg, #fff7ed, #ffffff)" }}
                    >
                      <div
                        className="bg-white rounded-4 shadow-sm d-inline-flex align-items-center justify-content-center mb-2"
                        style={{ width: 52, height: 52 }}
                      >
                        <i className="bi bi-database fs-3 text-warning"></i>
                      </div>
                      <span className="badge bg-warning-subtle text-warning position-absolute top-0 end-0 m-2">
                        DB-202
                      </span>
                    </div>

                    <div className="card-body d-flex flex-column">
                      <span className="text-uppercase text-muted small fw-semibold">
                        Backend
                      </span>
                      <h6 className="fw-bold mb-1 mt-1">
                        Database Management
                      </h6>
                      <p className="small text-muted mb-3">
                        SQL, normalization, and ACID transactions in modern systems.
                      </p>

                      <div className="mt-auto">
                        <div className="d-flex justify-content-between small text-muted mb-1">
                          <span>Progress</span>
                          <span className="fw-semibold text-dark">82%</span>
                        </div>
                        <div className="progress mb-3" style={{ height: 6 }}>
                          <div
                            className="progress-bar bg-warning"
                            style={{ width: "82%" }}
                          ></div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center border-top pt-3">
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="bg-secondary-subtle rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: 26, height: 26 }}
                            >
                              <i className="bi bi-person-fill text-secondary"></i>
                            </div>
                            <small className="text-muted">Dr. Chen</small>
                          </div>
                          <button className="btn btn-sm btn-light rounded-circle">
                            <i className="bi bi-arrow-right"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 3 */}
                <div className="col-md-6 col-lg-4 col-xl-3">
                  <div className="card border-0 shadow-sm rounded-4 h-100">
                    <div
                      className="rounded-top-4 p-4 text-center position-relative"
                      style={{ background: "linear-gradient(135deg, #fdf2f8, #ffffff)" }}
                    >
                      <div
                        className="bg-white rounded-4 shadow-sm d-inline-flex align-items-center justify-content-center mb-2"
                        style={{ width: 52, height: 52 }}
                      >
                        <i className="bi bi-palette fs-3 text-danger"></i>
                      </div>
                      <span className="badge bg-danger-subtle text-danger position-absolute top-0 end-0 m-2">
                        DS-301
                      </span>
                    </div>

                    <div className="card-body d-flex flex-column">
                      <span className="text-uppercase text-muted small fw-semibold">
                        Design
                      </span>
                      <h6 className="fw-bold mb-1 mt-1">UI / UX Principles</h6>
                      <p className="small text-muted mb-3">
                        Wireframing, prototyping, and usability research methods.
                      </p>

                      <div className="mt-auto">
                        <div className="d-flex justify-content-between small text-muted mb-1">
                          <span>Progress</span>
                          <span className="fw-semibold text-dark">12%</span>
                        </div>
                        <div className="progress mb-3" style={{ height: 6 }}>
                          <div
                            className="progress-bar bg-danger"
                            style={{ width: "12%" }}
                          ></div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center border-top pt-3">
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="bg-secondary-subtle rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: 26, height: 26 }}
                            >
                              <i className="bi bi-person-fill text-secondary"></i>
                            </div>
                            <small className="text-muted">Mr. Doe</small>
                          </div>
                          <button className="btn btn-sm btn-light rounded-circle">
                            <i className="bi bi-arrow-right"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Completed */}
                <div className="col-md-6 col-lg-4 col-xl-3">
                  <div className="card border-0 shadow-sm rounded-4 h-100 opacity-75">
                    <div className="rounded-top-4 p-4 text-center position-relative bg-light">
                      <div
                        className="bg-white rounded-4 shadow-sm d-inline-flex align-items-center justify-content-center mb-2"
                        style={{ width: 52, height: 52 }}
                      >
                        <i className="bi bi-calculator fs-3 text-success"></i>
                      </div>
                      <span className="badge bg-success-subtle text-success position-absolute top-0 end-0 m-2">
                        Passed
                      </span>
                    </div>

                    <div className="card-body d-flex flex-column">
                      <span className="text-uppercase text-muted small fw-semibold">
                        Math
                      </span>
                      <h6 className="fw-bold mb-1 mt-1">Calculus III</h6>
                      <p className="small text-muted mb-3">
                        Multivariable calculus and vector analysis.
                      </p>

                      <div className="mt-auto">
                        <div className="d-flex justify-content-between small text-muted mb-1">
                          <span>Grade</span>
                          <span className="fw-semibold text-success">A (94%)</span>
                        </div>
                        <div className="progress mb-3" style={{ height: 6 }}>
                          <div
                            className="progress-bar bg-success"
                            style={{ width: "100%" }}
                          ></div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center border-top pt-3">
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="bg-secondary-subtle rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: 26, height: 26 }}
                            >
                              <i className="bi bi-person-fill text-secondary"></i>
                            </div>
                            <small className="text-muted">Dr. Lee</small>
                          </div>
                          <button className="btn btn-sm btn-light rounded-circle">
                            <i className="bi bi-arrow-repeat"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* IN PROGRESS */}
            {activeTab === "progress" && (
              <div className="row g-4">
                {/* Just the 3 in-progress cards */}
                {/* Card 1 */}
                <div className="col-md-6 col-lg-4 col-xl-3">
                  <div className="card border-0 shadow-sm rounded-4 h-100">
                    <div
                      className="rounded-top-4 p-4 text-center position-relative"
                      style={{ background: "linear-gradient(135deg, #eef2ff, #ffffff)" }}
                    >
                      <div
                        className="bg-white rounded-4 shadow-sm d-inline-flex align-items-center justify-content-center mb-2"
                        style={{ width: 52, height: 52 }}
                      >
                        <i className="bi bi-code-slash fs-3 text-primary"></i>
                      </div>
                      <span className="badge bg-primary-subtle text-primary position-absolute top-0 end-0 m-2">
                        CS-101
                      </span>
                    </div>

                    <div className="card-body d-flex flex-column">
                      <span className="text-uppercase text-muted small fw-semibold">
                        Computer Science
                      </span>
                      <h6 className="fw-bold mb-1 mt-1">
                        Data Structures & Algorithms
                      </h6>
                      <p className="small text-muted mb-3">
                        Master arrays, trees, graphs, and advanced problem solving.
                      </p>

                      <div className="mt-auto">
                        <div className="d-flex justify-content-between small text-muted mb-1">
                          <span>Progress</span>
                          <span className="fw-semibold text-dark">45%</span>
                        </div>
                        <div className="progress mb-3" style={{ height: 6 }}>
                          <div
                            className="progress-bar bg-primary"
                            style={{ width: "45%" }}
                          ></div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center border-top pt-3">
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="bg-secondary-subtle rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: 26, height: 26 }}
                            >
                              <i className="bi bi-person-fill text-secondary"></i>
                            </div>
                            <small className="text-muted">Prof. Smith</small>
                          </div>
                          <button className="btn btn-sm btn-light rounded-circle">
                            <i className="bi bi-arrow-right"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="col-md-6 col-lg-4 col-xl-3">
                  <div className="card border-0 shadow-sm rounded-4 h-100">
                    <div
                      className="rounded-top-4 p-4 text-center position-relative"
                      style={{ background: "linear-gradient(135deg, #fff7ed, #ffffff)" }}
                    >
                      <div
                        className="bg-white rounded-4 shadow-sm d-inline-flex align-items-center justify-content-center mb-2"
                        style={{ width: 52, height: 52 }}
                      >
                        <i className="bi bi-database fs-3 text-warning"></i>
                      </div>
                      <span className="badge bg-warning-subtle text-warning position-absolute top-0 end-0 m-2">
                        DB-202
                      </span>
                    </div>

                    <div className="card-body d-flex flex-column">
                      <span className="text-uppercase text-muted small fw-semibold">
                        Backend
                      </span>
                      <h6 className="fw-bold mb-1 mt-1">
                        Database Management
                      </h6>
                      <p className="small text-muted mb-3">
                        SQL, normalization, and ACID transactions in modern systems.
                      </p>

                      <div className="mt-auto">
                        <div className="d-flex justify-content-between small text-muted mb-1">
                          <span>Progress</span>
                          <span className="fw-semibold text-dark">82%</span>
                        </div>
                        <div className="progress mb-3" style={{ height: 6 }}>
                          <div
                            className="progress-bar bg-warning"
                            style={{ width: "82%" }}
                          ></div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center border-top pt-3">
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="bg-secondary-subtle rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: 26, height: 26 }}
                            >
                              <i className="bi bi-person-fill text-secondary"></i>
                            </div>
                            <small className="text-muted">Dr. Chen</small>
                          </div>
                          <button className="btn btn-sm btn-light rounded-circle">
                            <i className="bi bi-arrow-right"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card 3 */}
                <div className="col-md-6 col-lg-4 col-xl-3">
                  <div className="card border-0 shadow-sm rounded-4 h-100">
                    <div
                      className="rounded-top-4 p-4 text-center position-relative"
                      style={{ background: "linear-gradient(135deg, #fdf2f8, #ffffff)" }}
                    >
                      <div
                        className="bg-white rounded-4 shadow-sm d-inline-flex align-items-center justify-content-center mb-2"
                        style={{ width: 52, height: 52 }}
                      >
                        <i className="bi bi-palette fs-3 text-danger"></i>
                      </div>
                      <span className="badge bg-danger-subtle text-danger position-absolute top-0 end-0 m-2">
                        DS-301
                      </span>
                    </div>

                    <div className="card-body d-flex flex-column">
                      <span className="text-uppercase text-muted small fw-semibold">
                        Design
                      </span>
                      <h6 className="fw-bold mb-1 mt-1">UI / UX Principles</h6>
                      <p className="small text-muted mb-3">
                        Wireframing, prototyping, and usability research methods.
                      </p>

                      <div className="mt-auto">
                        <div className="d-flex justify-content-between small text-muted mb-1">
                          <span>Progress</span>
                          <span className="fw-semibold text-dark">12%</span>
                        </div>
                        <div className="progress mb-3" style={{ height: 6 }}>
                          <div
                            className="progress-bar bg-danger"
                            style={{ width: "12%" }}
                          ></div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center border-top pt-3">
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="bg-secondary-subtle rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: 26, height: 26 }}
                            >
                              <i className="bi bi-person-fill text-secondary"></i>
                            </div>
                            <small className="text-muted">Mr. Doe</small>
                          </div>
                          <button className="btn btn-sm btn-light rounded-circle">
                            <i className="bi bi-arrow-right"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* COMPLETED */}
            {activeTab === "completed" && (
              <div className="row g-4">
                <div className="col-md-6 col-lg-4 col-xl-3">
                  <div className="card border-0 shadow-sm rounded-4 h-100 opacity-75">
                    <div className="rounded-top-4 p-4 text-center position-relative bg-light">
                      <div
                        className="bg-white rounded-4 shadow-sm d-inline-flex align-items-center justify-content-center mb-2"
                        style={{ width: 52, height: 52 }}
                      >
                        <i className="bi bi-calculator fs-3 text-success"></i>
                      </div>
                      <span className="badge bg-success-subtle text-success position-absolute top-0 end-0 m-2">
                        Passed
                      </span>
                    </div>

                    <div className="card-body d-flex flex-column">
                      <span className="text-uppercase text-muted small fw-semibold">
                        Math
                      </span>
                      <h6 className="fw-bold mb-1 mt-1">Calculus III</h6>
                      <p className="small text-muted mb-3">
                        Multivariable calculus and vector analysis.
                      </p>

                      <div className="mt-auto">
                        <div className="d-flex justify-content-between small text-muted mb-1">
                          <span>Grade</span>
                          <span className="fw-semibold text-success">A (94%)</span>
                        </div>
                        <div className="progress mb-3" style={{ height: 6 }}>
                          <div
                            className="progress-bar bg-success"
                            style={{ width: "100%" }}
                          ></div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center border-top pt-3">
                          <div className="d-flex align-items-center gap-2">
                            <div
                              className="bg-secondary-subtle rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: 26, height: 26 }}
                            >
                              <i className="bi bi-person-fill text-secondary"></i>
                            </div>
                            <small className="text-muted">Dr. Lee</small>
                          </div>
                          <button className="btn btn-sm btn-light rounded-circle">
                            <i className="bi bi-arrow-repeat"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ARCHIVED */}
            {activeTab === "archived" && (
              <div className="text-center py-5 text-muted">
                <i className="bi bi-archive fs-1 mb-3 d-block"></i>
                <h6 className="fw-bold">No archived subjects</h6>
                <p className="small mb-0">
                  Archived subjects will appear here.
                </p>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="d-flex justify-content-between align-items-center border-top mt-4 pt-3">
            <small className="text-muted">
              Showing subjects based on selected filter
            </small>
            <div className="d-flex gap-2">
              <button className="btn btn-sm btn-light rounded-pill" disabled>
                Previous
              </button>
              <button className="btn btn-sm btn-light rounded-pill">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectPage;