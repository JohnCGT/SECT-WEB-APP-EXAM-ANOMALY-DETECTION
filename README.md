# SECT  
## A Web-Based Examination System with Cheating Probability Index and Behavior-Based Anomaly Detection Using Isolation Forest and One-Class SVM Algorithms

SECT is a web-based examination platform designed to enhance academic integrity by detecting potential cheating behaviors using machine learning–based anomaly detection techniques. The system computes a **Cheating Probability Index (CPI)** by analyzing user behavior during online examinations and identifying anomalies through **Isolation Forest** and **One-Class Support Vector Machine (OC-SVM)** algorithms.

This project is developed as an academic research and thesis implementation.

---

## 📌 Features

- 📝 Web-based online examination system  
- 👤 Secure student and administrator access  
- 📊 Cheating Probability Index (CPI) computation  
- 🤖 Behavior-based anomaly detection  
  - Isolation Forest  
  - One-Class SVM  
- ⏱️ Behavioral tracking (e.g., timing, interaction patterns)  
- 📈 Visualization of anomaly scores and CPI results  
- 📁 Exam and user management dashboard  

---

## 🧠 Machine Learning Approach

### Isolation Forest
- Detects anomalous student behavior by isolating rare patterns  
- Efficient for high-dimensional behavioral data  

### One-Class SVM
- Learns normal examination behavior  
- Flags deviations as potential cheating behavior  

Both models contribute to generating the **Cheating Probability Index (CPI)**.

---

## 🛠️ Tech Stack

### Frontend
- React.js  
- HTML5, CSS3, JavaScript  

### Backend
- Node.js  
- Express.js  

### Machine Learning
- Python  
- Scikit-learn  

### Database
- MongoDB / MySQL  

### Version Control
- Git & GitHub  

---

## 📂 Project Structure

```bash
SECT/
│
├── frontend/        # React frontend
├── backend/         # Node.js & Express backend
├── ml/              # Machine learning models and scripts
├── database/        # Database schemas and configurations
├── docs/            # Documentation and research files
└── README.md
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js 24.x.x 
- npm or yarn  
- Python 3.x  
- Git  

### Clone the Repository
```bash
cd desktop
git clone https://github.com/your-username/SECT.git
```

## First-Time Development


### Before development, you must do this following command
```bash
npm install
npm install react-router-dom
npm install bootstrap bootstrap-icons
npm install express mysql2 cors bcryptjs body-parser
npm install axios
```

### Fetch all remote branches
```bash
git fetch --all --prune
```

### Create local tracking branches for all remote branches
```bash
git branch -r | ForEach-Object {
    $branch = $_ -replace 'origin/', '' -replace '\s', ''
    if ($branch -notmatch '->') {
        git branch --track $branch "origin/$branch" 2>$null
    }
}
```

### Pull latest changes for all local branches
```bash
git pull --all
```

---

## 📊 Cheating Probability Index (CPI)

The CPI is a numerical score representing the likelihood of cheating based on:
- Behavioral anomalies  
- Model predictions  
- Statistical deviation from normal exam behavior  

Higher CPI values indicate a higher probability of suspicious behavior.

---

## 🎓 Research Purpose

This system is developed for academic research to:
- Improve integrity in online examinations  
- Explore the effectiveness of unsupervised learning for cheating detection  
- Serve as a reference system for future studies  

---

## ⚠️ Disclaimer

This system **does not automatically accuse users of cheating**.  
Detected anomalies are intended to assist educators and administrators in decision-making.

---

## 📄 License

This project is intended for **academic and educational use only**.

---

## 👨‍💻 Authors

- John Carlo Tulin
- Eumy Simoun Castillo
- Jacinto Jose Guban
- Sammanne Vhelle Esita
