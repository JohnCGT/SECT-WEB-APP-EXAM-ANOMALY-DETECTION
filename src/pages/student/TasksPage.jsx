import React from "react";
import { Link } from "react-router-dom";

const TasksPage = () => {
  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      {/* Top Navbar */}
      <nav className="navbar navbar-expand-lg bg-white border-bottom shadow-sm">
        <div className="container-fluid">
          <span className="navbar-brand fw-bold text-primary d-flex align-items-center gap-2">
            🎓 SECT Student Portal
          </span>

          {/* Search */}
          <form className="d-flex mx-auto" style={{ width: "38%" }}>
            <input
              type="search"
              className="form-control rounded-pill px-4"
              placeholder="Search tasks..."
            />
          </form>

          {/* Profile */}
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
              <li><a className="dropdown-item" href="#">My Profile</a></li>
              <li><a className="dropdown-item" href="#">Settings</a></li>
              <li><hr className="dropdown-divider" /></li>
              <li><Link className="dropdown-item text-danger" to="/">Logout</Link></li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Layout */}
      <div className="d-flex flex-grow-1">
        {/* Sidebar */}
        <nav className="bg-white border-end shadow-sm" style={{ width: "110px", minHeight: "100%" }}>
          <ul className="nav flex-column p-3 align-items-center gap-2">
            <li className="nav-item w-100">
              <Link to="/student" className="nav-link text-dark fw-semibold d-flex flex-column align-items-center py-3 rounded-4">
                <i className="bi bi-speedometer2 fs-4 mb-1"></i>
                <span>Home</span>
              </Link>
            </li>

            <li className="nav-item w-100">
              <Link
                className="nav-link text-dark fw-semibold d-flex flex-column align-items-center py-3 rounded-4"
                to="/student/subjects"
              >
                <i className="bi bi-journal-bookmark fs-4 mb-1"></i>
                <span>Subjects</span>
              </Link>
            </li>

            <li className="nav-item w-10">
              <Link
                to="/student/tasks"
                className="nav-link active bg-primary text-white rounded-4 fw-semibold d-flex flex-column align-items-center py-3 shadow-sm"
              >
                <i className="bi bi-pencil-square fs-3 mb-1"></i>
                <span>Tasks</span>
              </Link>
            </li>

            <li className="nav-item w-100">
              <Link className="nav-link text-dark fw-semibold d-flex flex-column align-items-center py-3 rounded-4" to="/student/grades">
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

        {/* Main Content */}
        <div className="flex-grow-1 p-4">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h4 className="fw-bold mb-1">📝 Assignments</h4>
              <small className="text-muted">Fall Semester 2025 • Tasks Overview</small>
            </div>

            <div className="d-flex gap-2">
              <input
                className="form-control form-control-sm rounded-pill px-3"
                style={{ width: 220 }}
                placeholder="Search assignments..."
              />
              <button className="btn btn-sm btn-outline-primary rounded-pill">
                <i className="bi bi-filter-circle me-1"></i>
                Filter
              </button>
            </div>
          </div>

          {/* Tabs */}
          <ul className="nav nav-tabs border-0 mb-4">
            <li className="nav-item">
              <button
                className="nav-link active fw-semibold"
                data-bs-toggle="tab"
                data-bs-target="#allTasks"
                type="button"
              >
                All Tasks
              </button>
            </li>
            <li className="nav-item">
              <button
                className="nav-link fw-semibold"
                data-bs-toggle="tab"
                data-bs-target="#inProgress"
                type="button"
              >
                In Progress
              </button>
            </li>
            <li className="nav-item">
              <button
                className="nav-link fw-semibold"
                data-bs-toggle="tab"
                data-bs-target="#completed"
                type="button"
              >
                Completed
              </button>
            </li>

            <li className="ms-auto d-flex gap-2">
              <button className="btn btn-sm btn-light rounded-circle"><i className="bi bi-list"></i></button>
              <button className="btn btn-sm btn-light rounded-circle"><i className="bi bi-grid"></i></button>
            </li>
          </ul>

          {/* Tab Content */}
          <div className="tab-content">
            {/* All Tasks */}
            <div id="allTasks" className="tab-pane fade show active">
              <div className="row g-4">
                {/* In Progress */}
                <div className="col-md-6 col-lg-4 col-xl-3">
                  <div className="card border-0 shadow-sm rounded-4 h-100 position-relative">
                    <div className="position-absolute start-0 top-0 bottom-0 w-1 bg-danger rounded-start"></div>
                    <div className="card-body d-flex flex-column">
                      <h6 className="fw-bold mb-2">Data Structures Project II</h6>
                      <span className="badge bg-danger mb-2">High Priority</span>
                      <p className="small text-muted mb-3">CS-101 • Implementation of Red-Black Trees</p>

                      <div className="mt-auto d-flex justify-content-between">
                        <div className="d-flex flex-column align-items-start">
                          <small className="text-muted">Due</small>
                          <span className="fw-semibold text-danger">Tomorrow</span>
                        </div>
                        <div className="d-flex flex-column align-items-start">
                          <small className="text-muted">Status</small>
                          <span className="fw-semibold text-dark">In Progress</span>
                        </div>
                        <button className="btn btn-sm btn-light rounded-circle">
                          <i className="bi bi-arrow-right"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Not Started */}
                <div className="col-md-6 col-lg-4 col-xl-3">
                  <div className="card border-0 shadow-sm rounded-4 h-100">
                    <div className="card-body d-flex flex-column">
                      <h6 className="fw-bold mb-2">SQL Optimization Quiz</h6>
                      <p className="small text-muted mb-3">DB-202 • Chapter 4-5 Review</p>

                      <div className="mt-auto d-flex justify-content-between">
                        <div className="d-flex flex-column align-items-start">
                          <small className="text-muted">Due</small>
                          <span className="fw-semibold text-dark">Fri, Oct 24</span>
                        </div>
                        <div className="d-flex flex-column align-items-start">
                          <small className="text-muted">Status</small>
                          <span className="text-muted">Not Started</span>
                        </div>
                        <button className="btn btn-sm btn-light rounded-circle">
                          <i className="bi bi-arrow-right"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Completed */}
                <div className="col-md-6 col-lg-4 col-xl-3">
                  <div className="card border-0 shadow-sm rounded-4 h-100 opacity-75">
                    <div className="card-body d-flex flex-column">
                      <h6 className="fw-bold mb-2 text-muted text-decoration-line-through">
                        Multivariable Calculus Exam
                      </h6>
                      <p className="small text-muted mb-3">MATH-201 • Score: 94/100</p>

                      <div className="mt-auto d-flex justify-content-between">
                        <div className="d-flex flex-column align-items-start">
                          <small className="text-muted">Graded</small>
                          <span className="fw-semibold text-success">Oct 12</span>
                        </div>
                        <div className="d-flex flex-column align-items-start">
                          <small className="text-muted">Grade</small>
                          <span className="fw-bold text-success">A</span>
                        </div>
                        <button className="btn btn-sm btn-light rounded-circle">
                          <i className="bi bi-eye"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* In Progress Tab */}
            <div id="inProgress" className="tab-pane fade">
              <div className="row g-4">
                <div className="col-md-6 col-lg-4 col-xl-3">
                  <div className="card border-0 shadow-sm rounded-4 h-100 position-relative">
                    <div className="position-absolute start-0 top-0 bottom-0 w-1 bg-danger rounded-start"></div>
                    <div className="card-body d-flex flex-column">
                      <h6 className="fw-bold mb-2">Data Structures Project II</h6>
                      <span className="badge bg-danger mb-2">High Priority</span>
                      <p className="small text-muted mb-3">CS-101 • Implementation of Red-Black Trees</p>

                      <div className="mt-auto d-flex justify-content-between">
                        <div className="d-flex flex-column align-items-start">
                          <small className="text-muted">Due</small>
                          <span className="fw-semibold text-danger">Tomorrow</span>
                        </div>
                        <div className="d-flex flex-column align-items-start">
                          <small className="text-muted">Status</small>
                          <span className="fw-semibold text-dark">In Progress</span>
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

            {/* Completed Tab */}
            <div id="completed" className="tab-pane fade">
              <div className="row g-4">
                <div className="col-md-6 col-lg-4 col-xl-3">
                  <div className="card border-0 shadow-sm rounded-4 h-100 opacity-75">
                    <div className="card-body d-flex flex-column">
                      <h6 className="fw-bold mb-2 text-muted text-decoration-line-through">
                        Multivariable Calculus Exam
                      </h6>
                      <p className="small text-muted mb-3">MATH-201 • Score: 94/100</p>

                      <div className="mt-auto d-flex justify-content-between">
                        <div className="d-flex flex-column align-items-start">
                          <small className="text-muted">Graded</small>
                          <span className="fw-semibold text-success">Oct 12</span>
                        </div>
                        <div className="d-flex flex-column align-items-start">
                          <small className="text-muted">Grade</small>
                          <span className="fw-bold text-success">A</span>
                        </div>
                        <button className="btn btn-sm btn-light rounded-circle">
                          <i className="bi bi-eye"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* End Tab Content */}
        </div>
      </div>
    </div>
  );
};

export default TasksPage;