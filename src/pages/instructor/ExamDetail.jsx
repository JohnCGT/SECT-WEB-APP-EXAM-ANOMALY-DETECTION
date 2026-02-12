import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import API from "../../api";
import Swal from 'sweetalert2';

const ExamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  useEffect(() => {
    fetchExamDetails();
  }, [id]);

  const fetchExamDetails = async () => {
    try {
      const res = await API.get(`/exams/${id}`);
      setExam(res.data.exam);
      setQuestions(res.data.exam.questions || []);
    } catch (err) {
      console.error('Failed to fetch exam:', err);
      Swal.fire('Error!', 'Failed to load exam details', 'error');
      navigate('/instructor/exams');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    const result = await Swal.fire({
      title: 'Delete this question?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await API.delete(`/exams/${id}/questions/${questionId}`);
        setQuestions(questions.filter(q => q.id !== questionId));
        Swal.fire('Deleted!', 'Question has been deleted.', 'success');
        fetchExamDetails(); // Refresh to update total points
      } catch (err) {
        console.error('Delete failed:', err);
        Swal.fire('Error!', 'Failed to delete question.', 'error');
      }
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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <Link to="/instructor/exams" className="btn btn-outline-secondary mb-2">
            <i className="bi bi-arrow-left me-2"></i>Back to Exams
          </Link>
          <h3>{exam.title}</h3>
          <p className="text-muted">{exam.course?.code} - {exam.course?.name}</p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setShowQuestionModal(true)}
        >
          <i className="bi bi-plus-circle me-2"></i>Add Question
        </button>
      </div>

      {/* Exam Info Card */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-3">
              <strong>Type:</strong> {exam.type}
            </div>
            <div className="col-md-3">
              <strong>Duration:</strong> {exam.duration_minutes} minutes
            </div>
            <div className="col-md-3">
              <strong>Total Points:</strong> {exam.total_points}
            </div>
            <div className="col-md-3">
              <strong>Questions:</strong> {questions.length}
            </div>
          </div>
          <div className="row mt-2">
            <div className="col-md-6">
              <strong>Start:</strong> {new Date(exam.start_time).toLocaleString()}
            </div>
            <div className="col-md-6">
              <strong>End:</strong> {new Date(exam.end_time).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="card">
        <div className="card-header">
          <h5>Questions ({questions.length})</h5>
        </div>
        <div className="card-body">
          {questions.length === 0 ? (
            <p className="text-center text-muted">No questions yet. Add your first question!</p>
          ) : (
            <div className="list-group">
              {questions.map((question, index) => (
                <div key={question.id} className="list-group-item">
                  <div className="d-flex justify-content-between align-items-start">
                    <div className="flex-grow-1">
                      <h6>Question {index + 1} ({question.points} points)</h6>
                      <span className="badge bg-info me-2">{question.type.replace('_', ' ')}</span>
                      <p className="mt-2">{question.question_text}</p>
                      
                      {question.type === 'multiple_choice' && question.options && (
                        <ul className="list-unstyled ms-3">
                          {question.options.map((option, idx) => (
                            <li key={idx} className={option === question.correct_answer ? 'text-success fw-bold' : ''}>
                              {String.fromCharCode(65 + idx)}. {option}
                              {option === question.correct_answer && ' ✓'}
                            </li>
                          ))}
                        </ul>
                      )}
                      
                      {question.type === 'true_false' && (
                        <p className="ms-3">
                          <strong>Answer:</strong> <span className="text-success">{question.correct_answer}</span>
                        </p>
                      )}
                      
                      {question.type === 'essay' && question.max_words && (
                        <p className="ms-3 text-muted">Max words: {question.max_words}</p>
                      )}
                    </div>
                    <button 
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDeleteQuestion(question.id)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Question Modal */}
      <AddQuestionModal 
        show={showQuestionModal}
        onHide={() => setShowQuestionModal(false)}
        examId={id}
        onSuccess={(newQuestion) => {
          setQuestions([...questions, newQuestion]);
          setShowQuestionModal(false);
          fetchExamDetails(); // Refresh to update total points
        }}
      />
    </div>
  );
};

// Add Question Modal Component
const AddQuestionModal = ({ show, onHide, examId, onSuccess }) => {
  const [formData, setFormData] = useState({
    type: 'multiple_choice',
    question_text: '',
    points: 1,
    options: ['', '', '', ''],
    correct_answer: '',
    max_words: null,
    rubric: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        type: formData.type,
        question_text: formData.question_text,
        points: formData.points,
      };

      if (formData.type === 'multiple_choice') {
        payload.options = formData.options.filter(o => o.trim() !== '');
        payload.correct_answer = formData.correct_answer;
      } else if (formData.type === 'true_false') {
        payload.correct_answer = formData.correct_answer;
      } else if (formData.type === 'essay') {
        payload.max_words = formData.max_words;
        payload.rubric = formData.rubric;
      }

      const res = await API.post(`/exams/${examId}/questions`, payload);
      Swal.fire('Success!', 'Question added successfully', 'success');
      onSuccess(res.data.question);
      
      // Reset form
      setFormData({
        type: 'multiple_choice',
        question_text: '',
        points: 1,
        options: ['', '', '', ''],
        correct_answer: '',
        max_words: null,
        rubric: ''
      });
    } catch (err) {
      console.error('Add question failed:', err);
      Swal.fire('Error!', err.response?.data?.message || 'Failed to add question', 'error');
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  if (!show) return null;

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Add Question</h5>
            <button type="button" className="btn-close" onClick={onHide}></button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Question Type *</label>
                <select
                  className="form-select"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_false">True/False</option>
                  <option value="essay">Essay</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Question Text *</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={formData.question_text}
                  onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                  required
                ></textarea>
              </div>

              <div className="mb-3">
                <label className="form-label">Points *</label>
                <input
                  type="number"
                  className="form-control"
                  min="1"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                  required
                />
              </div>

              {formData.type === 'multiple_choice' && (
                <>
                  <div className="mb-3">
                    <label className="form-label">Options *</label>
                    {formData.options.map((option, index) => (
                      <input
                        key={index}
                        type="text"
                        className="form-control mb-2"
                        placeholder={`Option ${String.fromCharCode(65 + index)}`}
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                        required
                      />
                    ))}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Correct Answer *</label>
                    <select
                      className="form-select"
                      value={formData.correct_answer}
                      onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                      required
                    >
                      <option value="">Select correct answer</option>
                      {formData.options.map((option, index) => (
                        option && <option key={index} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {formData.type === 'true_false' && (
                <div className="mb-3">
                  <label className="form-label">Correct Answer *</label>
                  <select
                    className="form-select"
                    value={formData.correct_answer}
                    onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                    required
                  >
                    <option value="">Select answer</option>
                    <option value="True">True</option>
                    <option value="False">False</option>
                  </select>
                </div>
              )}

              {formData.type === 'essay' && (
                <>
                  <div className="mb-3">
                    <label className="form-label">Maximum Words</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      value={formData.max_words || ''}
                      onChange={(e) => setFormData({ ...formData, max_words: parseInt(e.target.value) || null })}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Grading Rubric</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={formData.rubric}
                      onChange={(e) => setFormData({ ...formData, rubric: e.target.value })}
                      placeholder="Describe how this question should be graded..."
                    ></textarea>
                  </div>
                </>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onHide}>Cancel</button>
              <button type="submit" className="btn btn-primary">Add Question</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExamDetail;