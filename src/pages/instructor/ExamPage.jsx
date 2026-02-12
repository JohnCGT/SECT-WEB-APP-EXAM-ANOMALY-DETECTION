import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../../api";
import Swal from 'sweetalert2';

const ExamPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [exams, setExams] = useState([]);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await API.post('/logout');
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
      navigate('/');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await API.get('/me');
        setUser(userRes.data.user);

        const coursesRes = await API.get('/courses');
        setCourses(coursesRes.data.courses);

        const examsRes = await API.get('/exams');
        setExams(examsRes.data.exams);
      } catch (err) {
        console.error('Failed to fetch data:', err);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const getExamStats = () => {
    const total = exams.length;
    const active = exams.filter(e => e.status === 'active').length;
    const scheduled = exams.filter(e => e.status === 'scheduled').length;
    const completed = exams.filter(e => e.status === 'completed').length;
    
    return { total, active, scheduled, completed };
  };

  const stats = getExamStats();

  const handleDeleteExam = async (examId) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await API.delete(`/exams/${examId}`);
        setExams(exams.filter(e => e.id !== examId));
        
        Swal.fire('Deleted!', 'Exam has been deleted.', 'success');
      } catch (err) {
        console.error('Delete failed:', err);
        Swal.fire('Error!', 'Failed to delete exam.', 'error');
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-success',
      scheduled: 'bg-warning text-dark',
      completed: 'bg-info',
      draft: 'bg-secondary'
    };
    return badges[status] || 'bg-secondary';
  };

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
          
          <form className="d-flex mx-auto" style={{ width: '40%' }}>
            <input 
              className="form-control" 
              type="search" 
              placeholder="Search exams..." 
              aria-label="Search"
            />
          </form>

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

      <div className="d-flex flex-grow-1">
        {/* Sidebar */}
        <nav className="text-black d-flex justify-content-center" style={{ width: '110px', minHeight: '100%' }}>
          <ul className="nav flex-column p-3 align-items-center">
            <li className="nav-item mb-3">
              <Link className="nav-link text-black fw-semibold d-flex flex-column align-items-center py-3" to="/instructor">
                <i className="bi bi-speedometer2 fs-4 mb-1"></i>
                <span>Dashboard</span>
              </Link>
            </li>
            <li className="nav-item mb-3">
              <Link className="nav-link text-white active bg-primary rounded fs-6 fw-semibold d-flex flex-column align-items-center py-3" to="/instructor/exams">
                <i className="bi bi-file-earmark-text fs-3 mb-1"></i>
                <span>Exams</span>
              </Link>
            </li>
            <li className="nav-item mb-3">
              <Link className="nav-link text-black fw-semibold d-flex flex-column align-items-center py-3" to="/instructor/courses">
                <i className="bi bi-book fs-3 mb-1"></i>
                <span>Courses</span>
              </Link>
            </li>
            <li className="nav-item mb-3">
              <Link className="nav-link text-black fw-semibold d-flex flex-column align-items-center py-3" to="/instructor/students">
                <i className="bi bi-people fs-3 mb-1"></i>
                <span>Students</span>
              </Link>
            </li>
          </ul>
        </nav>

        {/* Main Content */}
        <div className="flex-grow-1 p-4 bg-light">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h4>Exam Management</h4>
            <div>
              <button 
                className="btn btn-outline-primary me-2"
                onClick={() => setShowCourseModal(true)}
              >
                <i className="bi bi-plus-circle me-2"></i>Create Course
              </button>
              <button 
                className="btn btn-primary"
                onClick={() => setShowExamModal(true)}
              >
                <i className="bi bi-plus-circle me-2"></i>Create Exam
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="row g-4 mb-4">
            <div className="col-md-3">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title text-muted">Total Exams</h6>
                  <p className="card-text display-6 fw-bold text-primary">{stats.total}</p>
                  <small className="text-muted">All time</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title text-muted">Active Exams</h6>
                  <p className="card-text display-6 fw-bold text-success">{stats.active}</p>
                  <small className="text-success">Currently ongoing</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title text-muted">Scheduled</h6>
                  <p className="card-text display-6 fw-bold text-warning">{stats.scheduled}</p>
                  <small className="text-warning">Upcoming exams</small>
                </div>
              </div>
            </div>
            <div className="col-md-3">
              <div className="card shadow-sm border-0">
                <div className="card-body">
                  <h6 className="card-title text-muted">Completed</h6>
                  <p className="card-text display-6 fw-bold text-info">{stats.completed}</p>
                  <small className="text-muted">Archived</small>
                </div>
              </div>
            </div>
          </div>

          {/* Exams Table */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <h5 className="card-title mb-3">All Exams</h5>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>EXAM NAME</th>
                      <th>COURSE</th>
                      <th>TYPE</th>
                      <th>START TIME</th>
                      <th>DURATION</th>
                      <th>QUESTIONS</th>
                      <th>STATUS</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exams.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center text-muted">
                          No exams found. Create your first exam!
                        </td>
                      </tr>
                    ) : (
                      exams.map((exam) => (
                        <tr key={exam.id}>
                          <td>{exam.title}</td>
                          <td>{exam.course?.code} - {exam.course?.name}</td>
                          <td><span className="badge bg-secondary">{exam.type}</span></td>
                          <td>{new Date(exam.start_time).toLocaleString()}</td>
                          <td>{exam.duration_minutes} min</td>
                          <td>{exam.questions_count || 0}</td>
                          <td>
                            <span className={`badge ${getStatusBadge(exam.status)}`}>
                              {exam.status}
                            </span>
                          </td>
                          <td>
                            <Link 
                              to={`/instructor/exams/${exam.id}`}
                              className="btn btn-sm btn-outline-primary me-1"
                            >
                              <i className="bi bi-eye"></i>
                            </Link>
                            <Link
                              to={`/instructor/exams/${exam.id}/edit`}
                              className="btn btn-sm btn-outline-secondary me-1"
                            >
                              <i className="bi bi-pencil"></i>
                            </Link>
                            <button 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteExam(exam.id)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Courses Section */}
          <div className="card shadow-sm border-0">
            <div className="card-body">
              <h5 className="card-title mb-3">Your Courses</h5>
              <div className="row g-3">
                {courses.length === 0 ? (
                  <div className="col-12 text-center text-muted">
                    No courses found. Create your first course!
                  </div>
                ) : (
                  courses.map((course) => (
                    <div key={course.id} className="col-md-4">
                      <div className="card border h-100">
                        <div className="card-body">
                          <h6 className="card-title">{course.code}</h6>
                          <p className="card-text">{course.name}</p>
                          <small className="text-muted">{course.exams_count || 0} exams</small>
                          <div className="mt-3">
                            <Link 
                              to={`/instructor/courses/${course.id}`}
                              className="btn btn-sm btn-primary me-2"
                            >
                              View Exams
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Course Modal */}
      <CreateCourseModal 
        show={showCourseModal}
        onHide={() => setShowCourseModal(false)}
        onSuccess={(newCourse) => {
          setCourses([newCourse, ...courses]);
          setShowCourseModal(false);
        }}
      />

      {/* Create Exam Modal */}
      <CreateExamModal 
        show={showExamModal}
        onHide={() => setShowExamModal(false)}
        courses={courses}
        onSuccess={(newExam) => {
          setExams([newExam, ...exams]);
          setShowExamModal(false);
        }}
      />
    </div>
  );
};

// Create Course Modal Component
const CreateCourseModal = ({ show, onHide, onSuccess }) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    semester: '',
    credits: 3
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/courses', formData);
      Swal.fire('Success!', 'Course created successfully', 'success');
      onSuccess(res.data.course);
      setFormData({ code: '', name: '', description: '', semester: '', credits: 3 });
    } catch (err) {
      console.error('Create course failed:', err);
      Swal.fire('Error!', err.response?.data?.message || 'Failed to create course', 'error');
    }
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Create New Course</h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Course Code *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., CS 101"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Course Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Data Structures"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>
              <div className="mb-3">
                <label className="form-label">Semester</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Fall 2026"
                  value={formData.semester}
                  onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Credits</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  max="6"
                  value={formData.credits}
                  onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onHide}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create Course</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Create Exam Modal Component
const CreateExamModal = ({ show, onHide, courses, onSuccess }) => {
  const [formData, setFormData] = useState({
    course_id: '',
    title: '',
    description: '',
    type: 'quiz',
    start_time: '',
    end_time: '',
    duration_minutes: 60
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/exams', formData);
      Swal.fire('Success!', 'Exam created successfully', 'success');
      onSuccess(res.data.exam);
      setFormData({
        course_id: '',
        title: '',
        description: '',
        type: 'quiz',
        start_time: '',
        end_time: '',
        duration_minutes: 60
      });
    } catch (err) {
      console.error('Create exam failed:', err);
      Swal.fire('Error!', err.response?.data?.message || 'Failed to create exam', 'error');
    }
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Create New Exam</h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Course *</label>
                <select
                  className="form-select"
                  value={formData.course_id}
                  onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                  required
                >
                  <option value="">Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Exam Title *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Midterm Examination"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Type *</label>
                <select
                  className="form-select"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="quiz">Quiz</option>
                  <option value="prelim">Prelim</option>
                  <option value="midterm">Midterm</option>
                  <option value="final">Final</option>
                </select>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">Start Time *</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    required
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">End Time *</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label">Duration (minutes) *</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onHide}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create Exam</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExamPage;