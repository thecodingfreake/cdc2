import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, LineElement, Title, Tooltip, Legend, PointElement } from 'chart.js';
import jsPDF from "jspdf";
import 'jspdf-autotable';
import { dashContext } from "./userContext";
import "./Userprofile.css";
import { Column } from "jspdf-autotable";

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Title, Tooltip, Legend);

const UserProfile = () => {
  const { userstate } = useContext(dashContext);
  const [testReports, setTestReports] = useState([]);
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:5000/userp/${userstate.email}`)
      .then(response => setTestReports(response.data))
      .catch(error => console.error("Error fetching test reports:", error));
    
    axios.get(`http://localhost:5000/ud/${userstate.email}`)
      .then(response => setUserDetails(response.data[0]))
      .catch(error => console.error("Error fetching user details:", error));
  }, [userstate.email]);

  const generateQuestionPaperPDF = (testId, testName) => {
    axios.get(`http://localhost:5000/get_question/${testId}`)
      .then(response => {
        const questions = response.data.questions;

        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(`${testName} - Question Paper`, 14, 22);
        doc.setFontSize(12);
        const tableColumn = ["Question", "Answer"];
        const tableRows = [];

        questions.forEach((q, index) => {
          const questionData = [
            q.question,
            q.answer || 'N/A' // Assuming questions have an 'answer' field
          ];
          tableRows.push(questionData);
        });

        doc.autoTable({
          startY: 30,
          head: [tableColumn],
          body: tableRows,
          theme: 'striped',
          headStyles: { fillColor: [22, 160, 133] },
        });

        doc.save(`${testName}_question_paper.pdf`);
      })
      .catch(error => console.error("Error fetching question paper:", error));
  };

  const chartData = {
    labels: testReports.map((_, index) => index + 1),
    datasets: [
      {
        label: 'Scores',
        data: testReports.map(report => report.score),
        borderColor: 'rgba(75, 192, 192, 0.6)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        fill: true,
        pointBackgroundColor: 'rgba(75, 192, 192, 1)',
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          title: (context) => testReports[context[0].dataIndex].test_name,
          label: (context) => `Score: ${context.raw}`,
        }
      },
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        display: false
      },
      x: {
        display: false
      }
    }
  };

  if (!userDetails) {
    return <div>Loading...</div>;
  }

  return (
    <div className="user-profile" style={{"flexDirection":"column"}}>
      <div className="user-info-chart">
        <div className="chart-section">
          <h2>Past Test Results</h2>
          <div className="chart-container">
            <Line data={chartData} options={chartOptions} />
          </div>
        </div>
        <div className="user-info">
          <img src="/path/to/profile-icon.png" alt="Profile Icon" className="profile-icon" />
          <div className="user-details">
            <h2>{userDetails.name}</h2>
            <p><strong>Email:</strong> {userDetails.email}</p>
            <p><strong>Department:</strong> {userDetails.dept}</p>
            <p><strong>Year:</strong> {userDetails.year}</p>
            <p><strong>Register No:</strong> {userDetails.registerno}</p>
            <p><strong>Role:</strong> {userDetails.role}</p>
          </div>
        </div>
      </div>
      <div className="test-reports">
        <h2>Past Test Reports</h2>
        <table>
          <thead>
            <tr>
              <th>Test Name</th>
              <th>Score</th>
              <th>Date</th>
              <th>Question Paper</th>
            </tr>
          </thead>
          <tbody>
            {testReports.map(report => (
              <tr key={report.test_id}>
                <td>{report.test_name}</td>
                <td>{report.score}</td>
                <td>{report.date}</td>
                <td>
                  <button onClick={() => generateQuestionPaperPDF(report.test_id, report.test_name)}>
                    Download Question Paper
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserProfile;
