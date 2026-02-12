import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api";

const ExamPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await API.post('/logout');
      // Clear any local state if needed
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
      navigate('/');
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        console.log('🔍 Attempting to fetch user...');
        const res = await API.get('/me');
        console.log('✅ User data received:', res.data);
        setUser(res.data.user);
      } catch (err) {
        console.error('❌ Failed to fetch user:', err);
        console.error('Error status:', err.response?.status);
        console.error('Error data:', err.response?.data);
        // If user is not authenticated, redirect to login
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Top Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm">
        <div className="container-fluid">
          <a className="navbar-brand fw-bold text-primary" href="#">SECT Instructor</a>
          
          {/* Search Bar */}
          <form className="d-flex mx-auto" style={{ width: '40%' }}>
            <input 
              className="form-control" 
              type="search" 
              placeholder="Search exams..." 
              aria-label="Search"
            />
          </form>

          {/* Account Dropdown */}
          <div className="dropdown">
            <button 
              className="btn btn-light dropdown-toggle d-flex align-items-center" 
              type="button" 
              id="accountDropdown" 
              data-bs-toggle="dropdown" 
              aria-expanded="false"
            >
              <span className="me-2 fw-bold">Welcome, {user?.name || 'Instructor'}</span>
            </button>
            <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="accountDropdown">
              <li>
                <Link className="dropdown-item" to="/instructor/account-settings">Account Settings</Link>
              </li>
              <li>
                <Link className="dropdown-item" to="/instructor/profile">Profile</Link>
              </li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button 
                  className="dropdown-item" 
                  onClick={handleLogout}
                  style={{ cursor: 'pointer', border: 'none', background: 'none', width: '100%', textAlign: 'left' }}
                >
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

{/* Main Layout with Sidebar */}
      <div className="d-flex flex-grow-1">
        {/* Sidebar */}
        <nav
            className="text-black d-flex justify-content-center"
            style={{ width: '110px', minHeight: '100%' }}
        >
            <ul className="nav flex-column p-3 align-items-center">
                <li className="nav-item mb-3">
                    <Link
                        className="nav-link text-white active bg-primary rounded fs-6 fw-semibold d-flex flex-column align-items-center py-3"
                        to="/instructor"
                    >
                        <i className="bi bi-speedometer2 fs-4 mb-1"></i>
                        <span>Dashboard</span>
                    </Link>
                </li>
                <li className="nav-item mb-3">
                    <Link
                        className="nav-link text-black fw-semibold d-flex flex-column align-items-center py-3"
                        to="/instructor/exams"
                    >
                        <i className="bi bi-file-earmark-text fs-3 mb-1"></i>
                        <span>Exams</span>
                    </Link>
                </li>
                <li className="nav-item mb-3">
                    <Link
                        className="nav-link text-black fw-semibold d-flex flex-column align-items-center py-3"
                        to="/instructor/students"
                    >
                        <i className="bi bi-people fs-3 mb-1"></i>
                        <span>Students</span>
                    </Link>
                </li>
                <li className="nav-item mb-3">
                    <Link
                        className="nav-link text-black fw-semibold d-flex flex-column align-items-center py-3"
                        to="/instructor/alerts"
                    >
                        <i className="bi bi-exclamation-triangle fs-3 mb-1"></i>
                        <span>Alerts</span>
                    </Link>
                </li>
                <li className="nav-item mb-3">
                    <Link
                        className="nav-link text-black fw-semibold d-flex flex-column align-items-center py-3"
                        to="/instructor/reports"
                    >
                        <i className="bi bi-bar-chart fs-3 mb-1"></i>
                        <span>Reports</span>
                    </Link>
                </li>              
                <li className="nav-item mb-3">
                    <Link
                        className="nav-link text-black fw-semibold d-flex flex-column align-items-center py-3"
                        to="/instructor/account-settings"
                    >
                        <i className="bi bi-file-earmark-text fs-3 mb-1"></i>
                        <span>Settings</span>
                    </Link>  
                </li>
            </ul>
        </nav>

        {/* Main Content */}
        <div className="flex-grow-1 p-4 bg-light">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4>Exam Management</h4>
            <button className="btn btn-primary">
              <i className="bi bi-plus-circle me-2"></i>Create New Exam
            </button>
          </div>

          {/* Exam Statistics Cards */}
          <div className="row g-4 mb-4">
            <div className="col-md-3">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title text-muted">Total Exams</h6>
                  <p className="card-text display-6 fw-bold text-primary">12</p>
                  <small className="text-muted">All time</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title text-muted">Active Exams</h6>
                  <p className="card-text display-6 fw-bold text-success">2</p>
                  <small className="text-success">Currently ongoing</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title text-muted">Scheduled</h6>
                  <p className="card-text display-6 fw-bold text-warning">5</p>
                  <small className="text-warning">Upcoming exams</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title text-muted">Completed</h6>
                  <p className="card-text display-6 fw-bold text-info">5</p>
                  <small className="text-muted">Archived</small>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Tabs */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <ul className="nav nav-tabs" role="tablist">
                <li className="nav-item">
                  <a className="nav-link active" data-bs-toggle="tab" href="#all-exams">All Exams</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" data-bs-toggle="tab" href="#active-exams">Active</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" data-bs-toggle="tab" href="#scheduled-exams">Scheduled</a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" data-bs-toggle="tab" href="#completed-exams">Completed</a>
                </li>
              </ul>

              <div className="tab-content mt-3">
                <div id="all-exams" className="tab-pane fade show active">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>EXAM NAME</th>
                        <th>SUBJECT</th>
                        <th>DATE & TIME</th>
                        <th>DURATION</th>
                        <th>STUDENTS</th>
                        <th>STATUS</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>Midterm Examination - Data Structures</td>
                        <td>CS 101</td>
                        <td>Feb 10, 2026 - 9:00 AM</td>
                        <td>2 hours</td>
                        <td>45</td>
                        <td><span className="badge bg-success">Active</span></td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary me-1">
                            <i className="bi bi-eye"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-secondary me-1">
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-danger">
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td>Quiz 3 - Algorithm Analysis</td>
                        <td>CS 102</td>
                        <td>Feb 12, 2026 - 2:00 PM</td>
                        <td>1 hour</td>
                        <td>40</td>
                        <td><span className="badge bg-warning text-dark">Scheduled</span></td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary me-1">
                            <i className="bi bi-eye"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-secondary me-1">
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-danger">
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td>Final Exam - Database Systems</td>
                        <td>CS 201</td>
                        <td>Feb 15, 2026 - 10:00 AM</td>
                        <td>3 hours</td>
                        <td>38</td>
                        <td><span className="badge bg-warning text-dark">Scheduled</span></td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary me-1">
                            <i className="bi bi-eye"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-secondary me-1">
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-danger">
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td>Prelim Exam - Web Development</td>
                        <td>CS 301</td>
                        <td>Feb 5, 2026 - 1:00 PM</td>
                        <td>2 hours</td>
                        <td>42</td>
                        <td><span className="badge bg-info">Completed</span></td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary me-1">
                            <i className="bi bi-eye"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-secondary me-1">
                            <i className="bi bi-bar-chart"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-danger">
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                      <tr>
                        <td>Quiz 2 - Network Security</td>
                        <td>CS 202</td>
                        <td>Feb 8, 2026 - 3:00 PM</td>
                        <td>1.5 hours</td>
                        <td>35</td>
                        <td><span className="badge bg-success">Active</span></td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary me-1">
                            <i className="bi bi-eye"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-secondary me-1">
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button className="btn btn-sm btn-outline-danger">
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Exam Configuration & Monitoring Settings */}
          <div className="row g-4">
            <div className="col-md-6">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title mb-3">Detection Settings Overview</h6>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span>Face Detection</span>
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" checked readOnly />
                      </div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span>Tab Switching Monitoring</span>
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" checked readOnly />
                      </div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span>Mouse Activity Tracking</span>
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" checked readOnly />
                      </div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span>Keyboard Pattern Analysis</span>
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" checked readOnly />
                      </div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span>Screen Recording</span>
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" readOnly />
                      </div>
                    </div>
                    <div className="d-flex justify-content-between align-items-center">
                      <span>Isolation Forest Algorithm</span>
                      <div className="form-check form-switch">
                        <input className="form-check-input" type="checkbox" checked readOnly />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title mb-3">Recent Exam Activity</h6>
                  <ul className="list-group list-group-flush">
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <strong>Midterm Exam - Data Structures</strong>
                        <br />
                        <small className="text-muted">Started 2 hours ago</small>
                      </div>
                      <span className="badge bg-success rounded-pill">45 Active</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <strong>Quiz 2 - Network Security</strong>
                        <br />
                        <small className="text-muted">Started 1 hour ago</small>
                      </div>
                      <span className="badge bg-success rounded-pill">35 Active</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <strong>Prelim Exam - Web Development</strong>
                        <br />
                        <small className="text-muted">Completed 3 days ago</small>
                      </div>
                      <span className="badge bg-info rounded-pill">Archived</span>
                    </li>
                    <li className="list-group-item d-flex justify-content-between align-items-center">
                      <div>
                        <strong>Quiz 3 - Algorithm Analysis</strong>
                        <br />
                        <small className="text-muted">Scheduled for Feb 12</small>
                      </div>
                      <span className="badge bg-warning text-dark rounded-pill">Upcoming</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamPage;