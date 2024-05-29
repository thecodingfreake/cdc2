import React, { useEffect, useState } from "react";
import "./l.css";
import axios from "axios";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { dashContext } from "./userContext";

import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';

const Liveleaderboard = () => {
  const {userstate,setUserstate}=useContext(dashContext)
  const navigate=useNavigate()

  const [name, setName] = useState("");
  const [testname, setTestname] = useState("");
  const [dept, setDept] = useState("");
  const [score, setScore] = useState("");
  const [ldata, setLdata] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testID, setTestID] = useState("");
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
  const fetchData = () => {
    if (testID) {
      setIsLoading(true);
      axios
        .get(`http://localhost:5000/testl/${testID}`)
        .then((res) => {
          const data = res.data;
          const sortedData = data.sort((a, b) => b.score - a.score);
          setLdata(sortedData);
          setIsLoading(false);
        })
        .catch((err) => {
          setError(err);
          setIsLoading(false);
        });
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [testID]);

  const handleSearch = (e) => {
    e.preventDefault();
  };

  const filteredData = ldata.filter((item) => {
    return (
      (name === "" ||
        item.user_id.toLowerCase().includes(name.toLowerCase())) &&
      (testname === "" ||
        item.test_name.toLowerCase().includes(testname.toLowerCase())) &&
      (dept === "" ||
        item.department.toLowerCase().includes(dept.toLowerCase())) &&
      (score === "" || String(item.score).includes(score))
    );
  });

  const downloadPDF = () => {
    const doc = new jsPDF();
    doc.text("Leaderboard", 20, 10);

    const tableColumn = [
      "Student ID",
      "Email",
      "Test Name",
      "Department",
      "Score",
    ];
    const tableRows = [];

    filteredData.forEach((item) => {
      const itemData = [
        item.user_id,
        item.email,
        item.test_name,
        item.department,
        item.score,
      ];
      tableRows.push(itemData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });

    doc.save("leaderboard.pdf");
  };

  if (error) {
    return <div>Error fetching data: {error.message}</div>;
  }

  return (
    <div>
      <input
        type="text"
        placeholder="Test ID"
        value={testID}
        className="leaderboard-searchbar"
        onChange={(e) => setTestID(e.target.value)}
      />
      <button onClick={fetchData} className="search-button">Get Test</button>
      <div className="lead-container">

        <div className="lead-right">
          <div className="lead-search">
            <form onSubmit={handleSearch}>
              <input
                type="text"
                placeholder="Search Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="leaderboard-searchbar"
              />
              <input
                type="text"
                placeholder="Search Test Name"
                value={testname}
                onChange={(e) => setTestname(e.target.value)}
                className="leaderboard-searchbar"
              />
              <input
                type="text"
                placeholder="Search Department"
                value={dept}
                onChange={(e) => setDept(e.target.value)}
                className="leaderboard-searchbar"
              />
              <input
                type="text"
                placeholder="Search Score"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                className="leaderboard-searchbar"
              />
              <button type="submit" className="search-button">
                Search
              </button>
            </form>
          </div>

          <div className="lead-download">
            <button onClick={downloadPDF} className="download-button">
              Download as PDF
            </button>
          </div>

          <div className="leaderboard-container">
            <table className="leaderboard-table">
              <thead>
                <tr>
                  <th>student ID</th>
                  <th>Test Name</th>
                  <th>Test ID</th>
                  <th>Department</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item, index) => (
                  <tr key={index}>
                    <td>{item.user_id}</td>
                    <td>{item.test_name}</td>
                    <td>{item.test_id}</td>
                    <td>{item.department}</td>
                    <td>{item.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Liveleaderboard;
