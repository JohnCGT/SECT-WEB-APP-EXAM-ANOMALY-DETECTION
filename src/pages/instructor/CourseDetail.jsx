import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import API from "../../api";
import Swal from 'sweetalert2';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourseDetails();
  }, [id]);

  const fetchCourseDetails = async () => {
    try {
      const res = await API.get(`/courses/${id}`);
      setCourse(res.data.course);
      setExams(res.data.course.exams || []);
    } catch (err) {
      console.error('Failed to fetch course:', err);
      Swal.fire('Error!', 'Failed to load course details', 'error');
      navigate('/instructor/exams');
    } finally {
      setLoading(false);
    }
  };

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
    <div className="container-fluid p-4">
      <div className="mb-4">
        <Link to="/instructor/exams" className="btn btn-outline-secondary mb-2">
          <i className="bi bi-arrow-left me-2"></i>Back to Exams
        </Link>
        <h3>{course.code} - {course.name}</h3>
        <p className="text-muted">{course.description}</p>
      </div>

      {/* Course Info Card */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-4">
              <strong>Course Code:</strong> {course.code}
            </div>
            <div className="col-md-4">
              <strong>Credits:</strong> {course.credits}
            </div>
            <div className="col-md-4">
              <strong>Semester:</strong> {course.semester || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      {/* Exams List */}
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5>Exams in this Course ({exams.length})</h5>
        </div>
        <div className="card-body">
          {exams.length === 0 ? (
            <p className="text-center text-muted">No exams in this course yet.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>EXAM NAME</th>
                    <th>TYPE</th>
                    <th>START TIME</th>
                    <th>DURATION</th>
                    <th>QUESTIONS</th>
                    <th>POINTS</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((exam) => (
                    <tr key={exam.id}>
                      <td>{exam.title}</td>
                      <td><span className="badge bg-secondary">{exam.type}</span></td>
                      <td>{new Date(exam.start_time).toLocaleString()}</td>
                      <td>{exam.duration_minutes} min</td>
                      <td>{exam.questions_count || 0}</td>
                      <td>{exam.total_points}</td>
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
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;