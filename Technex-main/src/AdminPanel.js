import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Pie } from 'react-chartjs-2';
import { Line } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';
import jsPDF from 'jspdf';
import { dashContext } from './userContext';
import 'jspdf-autotable';
import ReactPaginate from 'react-paginate';
import './AdminPanel.css';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';

// Register the elements with Chart.js
Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

const AdminPanel = () => {
  const {userstate,setUserstate}=useContext(dashContext)
  const [departmentStats, setDepartmentStats] = useState([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [userTests, setUserTests] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [testId, setTestId] = useState('');
  const [testAnalysis, setTestAnalysis] = useState([]);
  const itemsPerPage = 5;
  const navigate=useNavigate()
  useEffect(()=>{
    try
    {
      if(userstate.admin!=true){
        navigate("/")
      }
  }
    catch(Err){
      console.log(Err)
    }
   },[])
  useEffect(() => {
    axios.get('http://localhost:5000/stats/').then(response => setDepartmentStats(response.data));
  }, []);

  const handleDownloadReport = () => {
    axios.get(`http://localhost:5000/stats/${testId}`).then(response => {
      const doc = new jsPDF();
      doc.text(`Analysis Report for Test ID: ${testId}`, 14, 22);
      const tableData = response.data.map(item => [
        item.department,
        item.average_score
      ]);
      doc.autoTable({
        head: [['Department', 'Average Score']],
        body: tableData,
        startY: 30,
      });
      doc.save('analysis-report.pdf');
    });
  };

  const handleSearch = () => {
    axios.get(`http://localhost:5000/ud/${searchEmail}`).then(response => {
      setUserProfile(response.data[0]);
      axios.get(`http://localhost:5000/userp/${searchEmail}`).then(res => setUserTests(res.data));
    });
  };

  const handleTestAnalysis = () => {
    axios.get(`http://localhost:5000/stats/${testId}`).then(response => setTestAnalysis(response.data));
  };

  const pageCount = Math.ceil(userTests.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const currentTests = userTests.slice(offset, offset + itemsPerPage);

  const pieData = {
    labels: departmentStats.map(stat => stat.dept),
    datasets: [{
      data: departmentStats.map(stat => stat.user_count),
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#FF9F40', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384'
      ],
      hoverOffset: 10,
    }]
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.raw || 0;
            return `${label}: ${value} Users`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
    }
  };

  const performanceData = {
    labels: userTests.map(test => test.test_name),
    datasets: [{
      label: 'Test Scores',
      data: userTests.map(test => test.score),
      borderColor: 'rgba(75,192,192,1)',
      backgroundColor: 'rgba(75,192,192,0.2)',
      fill: true,
    }]
  };

  const performanceOptions = {
    plugins: {
      legend: {
        display: false,
      }
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      }
    }
  };

  return (
    <div className="admin-panel">
      <div className="top-section">
        <div className="cards">
          {departmentStats.map(stat => (
            <div className="card" key={stat.dept}>
              <h3>{stat.dept}</h3>
              <p>{stat.user_count} Users</p>
            </div>
          ))}
        </div>
        <div className="pie-chart">
          <Pie data={pieData} options={pieOptions} />
        </div>
      </div>

      <div className="total-users">
        <h3>Total Users: {departmentStats.reduce((sum, stat) => sum + stat.user_count, 0)}</h3>
      </div>

      <div className="report-download">
        <input 
          type="text" 
          placeholder="Enter Test ID" 
          value={testId} 
          onChange={(e) => setTestId(e.target.value)} 
        />
        <button onClick={handleTestAnalysis}>Get Analysis</button>
        <button onClick={handleDownloadReport}>Download Analysis Report</button>
      </div>

      {testAnalysis.length > 0 && (
        <div className="test-analysis">
          <h2>Test Analysis</h2>
          <table className="styled-table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Average Score</th>
              </tr>
            </thead>
            <tbody>
              {testAnalysis.map((item, index) => (
                <tr key={index}>
                  <td>{item.department}</td>
                  <td>{item.average_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="user-search">
        <input 
          type="text" 
          placeholder="Enter User Email" 
          value={searchEmail} 
          onChange={(e) => setSearchEmail(e.target.value)} 
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      {userProfile && (
        <div className="user-profile">
          <div className="user-details">
            <h2>User Profile</h2>
            <p><strong>Name:</strong> {userProfile.name}</p>
            <p><strong>Email:</strong> {userProfile.email}</p>
            <p><strong>Department:</strong> {userProfile.dept}</p>
            <p><strong>Year:</strong> {userProfile.year}</p>
            <p><strong>Register No:</strong> {userProfile.registerno}</p>
            <p><strong>Role:</strong> {userProfile.role}</p>
          </div>
          <div className="user-graph">
            <h3>Performance</h3>
            <Line data={performanceData} options={performanceOptions} />
          </div>
        </div>
      )}

      {userTests.length > 0 && (
        <div className="user-tests">
          <h3>Performance Table</h3>
          <table className="styled-table">
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Score</th>
                <th>Test ID</th>
              </tr>
            </thead>
            <tbody>
              {currentTests.map(test => (
                <tr key={test.test_id}>
                  <td>{test.test_name}</td>
                  <td>{test.score}</td>
                  <td>{test.test_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <ReactPaginate
            previousLabel={'Previous'}
            nextLabel={'Next'}
            breakLabel={'...'}
            pageCount={pageCount}
            marginPagesDisplayed={2}
            pageRangeDisplayed={5}
            onPageChange={(data) => setCurrentPage(data.selected)}
            containerClassName={'pagination'}
            activeClassName={'active'}
          />
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
