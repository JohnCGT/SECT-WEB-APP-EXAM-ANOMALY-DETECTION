import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import API from "../../api";
import Swal from 'sweetalert2';

const ExamEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    course_id: '',
    title: '',
    description: '',
    type: 'quiz',
    start_time: '',
    end_time: '',
    duration_minutes: 60,
    status: 'draft',
  });

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      // Fetch exam details
      const examRes = await API.get(`/exams/${id}`);
      const exam = examRes.data.exam;
      
      // Fetch courses
      const coursesRes = await API.get('/courses');
      setCourses(coursesRes.data.courses);

      // Format datetime for input fields
      setFormData({
        course_id: exam.course_id,
        title: exam.title,
        description: exam.description || '',
        type: exam.type,
        start_time: formatDateTimeLocal(exam.start_time),
        end_time: formatDateTimeLocal(exam.end_time),
        duration_minutes: exam.duration_minutes,
        status: exam.status,
      });
    } catch (err) {
      console.error('Failed to fetch exam:', err);
      Swal.fire('Error!', 'Failed to load exam details', 'error');
      navigate('/instructor/exams');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTimeLocal = (dateString) => {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/exams/${id}`, formData);
      Swal.fire('Success!', 'Exam updated successfully', 'success');
      navigate(`/instructor/exams/${id}`);
    } catch (err) {
      console.error('Update failed:', err);
      Swal.fire('Error!', err.response?.data?.message || 'Failed to update exam', 'error');
    }
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
        <Link to={`/instructor/exams/${id}`} className="btn btn-outline-secondary mb-2">
          <i className="bi bi-arrow-left me-2"></i>Back to Exam Details
        </Link>
        <h3>Edit Exam</h3>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card mb-4">
          <div className="card-header">
            <h5>Basic Information</h5>
          </div>
          <div className="card-body">
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
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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

            <div className="row">
              <div className="col-md-6 mb-3">
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

              <div className="col-md-6 mb-3">
                <label className="form-label">Status *</label>
                <select
                  className="form-select"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  required
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="row">
              <div className="col-md-4 mb-3">
                <label className="form-label">Start Time *</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                  required
                />
              </div>

              <div className="col-md-4 mb-3">
                <label className="form-label">End Time *</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={formData.end_time}
                  onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                  required
                />
              </div>

              <div className="col-md-4 mb-3">
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
            </div>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary">
            <i className="bi bi-save me-2"></i>Save Changes
          </button>
          <Link to={`/instructor/exams/${id}`} className="btn btn-secondary">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ExamEdit;