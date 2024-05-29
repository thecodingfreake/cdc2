import React, { useState, useEffect } from "react";
import axios from "axios";
import { Table, Button, Input, Pagination, Checkbox, Dropdown } from "semantic-ui-react";
import './setExam.css';

const SetExam = () => {
  const [aptitudeQuestions, setAptitudeQuestions] = useState([]);
  const [verbalQuestions, setVerbalQuestions] = useState([]);
  const [technicalQuestions, setTechnicalQuestions] = useState([]);
  const [selectedTechnicalQuestions, setSelectedTechnicalQuestions] = useState([]);
  const [selectedVerbalQuestions, setSelectedVerbalQuestions] = useState([]);
  const [selectedAptitudeQuestions, setSelectedAptitudeQuestions] = useState([]);
  const [displayedQuestions, setDisplayedQuestions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchId, setSearchId] = useState("");
  const [searchQuestion, setSearchQuestion] = useState("");
  const [searchTopic, setSearchTopic] = useState("");
  const [searchDifficulty, setSearchDifficulty] = useState("");
  const [searchCompany, setSearchCompany] = useState("");
  const [searchType, setSearchType] = useState("");
  const [activeTab, setActiveTab] = useState("technical");
  const [testName, setTestName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [duration, setDuration] = useState("");

  useEffect(() => {
    const fetchDatabase = async () => {
      try {
        const response = await axios.get("http://localhost:5000/cq");
        const { apt, tech, ver } = response.data;
        setAptitudeQuestions(apt[0]);
        setTechnicalQuestions(tech[0]);
        setVerbalQuestions(ver[0]);
        setDisplayedQuestions(tech[0]);
      } catch (error) {
        console.error("Error fetching questions:", error);
      }
    };
    fetchDatabase();
  }, []);

  useEffect(() => {
    switch (activeTab) {
      case "aptitude":
        setDisplayedQuestions(aptitudeQuestions);
        break;
      case "verbal":
        setDisplayedQuestions(verbalQuestions);
        break;
      default:
        setDisplayedQuestions(technicalQuestions);
    }
    setCurrentPage(1); // Reset to first page on tab switch
  }, [activeTab, aptitudeQuestions, verbalQuestions, technicalQuestions]);

  const handleSearch = (event, setSearch) => {
    setSearch(event.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const companyOptions = [
    { key: "all", text: "All", value: "" },
    ...Array.from(new Set([...aptitudeQuestions, ...verbalQuestions, ...technicalQuestions].map(q => q.company)))
      .map(company => ({ key: company, text: company, value: company }))
  ];

  const typeOptions = [
    { key: "all", text: "All", value: "" },
    { key: "mcq", text: "MCQ", value: "MCQ" },
    { key: "short", text: "Short Answer", value: "Short" }
  ];

  const filteredQuestions = displayedQuestions.filter((question) => {
    const idMatch = question.id.toString().includes(searchId);
    const questionMatch = question.question
      .toLowerCase()
      .includes(searchQuestion.toLowerCase());
    const topicMatch = question.topic
      .toLowerCase()
      .includes(searchTopic.toLowerCase());
    const difficultyMatch = question.difficulty
      .toLowerCase()
      .includes(searchDifficulty.toLowerCase());
    const companyMatch = question.company
      .toLowerCase()
      .includes(searchCompany.toLowerCase());
    const typeMatch = question.type
      .toLowerCase()
      .includes(searchType.toLowerCase());
    return (
      idMatch && questionMatch && topicMatch && difficultyMatch && companyMatch && typeMatch
    );
  });

  const questionsPerPage = 10;
  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);
  const displayedPageQuestions = filteredQuestions.slice(
    (currentPage - 1) * questionsPerPage,
    currentPage * questionsPerPage
  );

  const handleCheckboxChange = (question) => {
    let setSelectedQuestions;
    let selectedQuestions;
    if (activeTab === "technical") {
      setSelectedQuestions = setSelectedTechnicalQuestions;
      selectedQuestions = selectedTechnicalQuestions;
    } else if (activeTab === "verbal") {
      setSelectedQuestions = setSelectedVerbalQuestions;
      selectedQuestions = selectedVerbalQuestions;
    } else {
      setSelectedQuestions = setSelectedAptitudeQuestions;
      selectedQuestions = selectedAptitudeQuestions;
    }
    setSelectedQuestions((prev) => {
      if (prev.some((q) => q.id === question.id)) {
        return prev.filter((q) => q.id !== question.id);
      } else {
        return [...prev, question];
      }
    });
  };

  const handleRemoveSelected = (id, tab) => {
    if (tab === "technical") {
      setSelectedTechnicalQuestions((prev) => prev.filter((q) => q.id !== id));
    } else if (tab === "verbal") {
      setSelectedVerbalQuestions((prev) => prev.filter((q) => q.id !== id));
    } else {
      setSelectedAptitudeQuestions((prev) => prev.filter((q) => q.id !== id));
    }
  };

  const generateTestId = () => {
    return 'test_' + Math.random().toString(36).substr(2, 9);
  };

  const handleSubmit = async () => {
    const testId = generateTestId();
    const tech = selectedTechnicalQuestions.map(q => q.id);
    const apt = selectedAptitudeQuestions.map(q => q.id);
    const verb = selectedVerbalQuestions.map(q => q.id);

    const requestBody = {
      testid: testId,
      tech: tech,
      apt: apt,
      verb: verb,
      testname: testName,
      start: startTime,
      end: endTime,
      duration: duration
    };

    try {
      const response = await axios.post("http://localhost:5000/test/schedule", requestBody);
      console.log("Test scheduled successfully:", response.data);
    } catch (error) {
      console.error("Error scheduling test:", error);
    }
  };

  const selectedQuestions =
    activeTab === "technical"
      ? selectedTechnicalQuestions
      : activeTab === "verbal"
      ? selectedVerbalQuestions
      : selectedAptitudeQuestions;

  return (
    <div style={{ padding: '20px' }}>
      <div className="tab-buttons">
        <Button.Group>
          <Button onClick={() => setActiveTab("technical")} active={activeTab === "technical"}>Technical</Button>
          <Button onClick={() => setActiveTab("verbal")} active={activeTab === "verbal"}>Verbal</Button>
          <Button onClick={() => setActiveTab("aptitude")} active={activeTab === "aptitude"}>Aptitude</Button>
        </Button.Group>
      </div>
      <div className="search-section">
        <Input
          icon="search"
          placeholder="Search ID"
          value={searchId}
          onChange={(e) => handleSearch(e, setSearchId)}
        />
        <Input
          icon="search"
          placeholder="Search Question"
          value={searchQuestion}
          onChange={(e) => handleSearch(e, setSearchQuestion)}
        />
        <Input
          icon="search"
          placeholder="Search Topic"
          value={searchTopic}
          onChange={(e) => handleSearch(e, setSearchTopic)}
        />
        <Input
          icon="search"
          placeholder="Search Difficulty"
          value={searchDifficulty}
          onChange={(e) => handleSearch(e, setSearchDifficulty)}
        />
        <Dropdown
          placeholder="Select Company"
          fluid
          selection
          options={companyOptions}
          value={searchCompany}
          onChange={(e, { value }) => {
            setSearchCompany(value);
            setCurrentPage(1); // Reset to first page on dropdown change
          }}
        />
        <Dropdown
          placeholder="Select Type"
          fluid
          selection
          options={typeOptions}
          value={searchType}
          onChange={(e, { value }) => {
            setSearchType(value);
            setCurrentPage(1); // Reset to first page on dropdown change
          }}
        />
      </div>
      <div className="table-container">
        <Table celled>
          <Table.Header className="table-header">
            <Table.Row>
              <Table.HeaderCell>ID</Table.HeaderCell>
              <Table.HeaderCell>Question</Table.HeaderCell>
              <Table.HeaderCell>Options</Table.HeaderCell>
              <Table.HeaderCell>Answer</Table.HeaderCell>
              <Table.HeaderCell>Type</Table.HeaderCell>
              <Table.HeaderCell>Topic</Table.HeaderCell>
              <Table.HeaderCell>Difficulty</Table.HeaderCell>
              <Table.HeaderCell>Company</Table.HeaderCell>
              <Table.HeaderCell>Select</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {displayedPageQuestions.map((question) => (
              <Table.Row key={question.id} className="table-row">
                <Table.Cell>{question.id}</Table.Cell>
                <Table.Cell>{question.question}</Table.Cell>
                <Table.Cell>{question.options.join(", ")}</Table.Cell>
                <Table.Cell>{question.answer.join(", ")}</Table.Cell>
                <Table.Cell>{question.type}</Table.Cell>
                <Table.Cell>{question.topic}</Table.Cell>
                <Table.Cell>{question.difficulty}</Table.Cell>
                <Table.Cell>{question.company}</Table.Cell>
                <Table.Cell>
                  <Checkbox
                    checked={selectedQuestions.some((q) => q.id === question.id)}
                    onChange={() => handleCheckboxChange(question)}
                  />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
      <div className="pagination-container">
        <Pagination
          totalPages={totalPages}
          activePage={currentPage}
          onPageChange={(e, { activePage }) => setCurrentPage(activePage)}
        />
      </div>
      <h3>Selected Questions</h3>
      <div style={{ marginBottom: '20px' }}>
        <Input
          placeholder="Test Name"
          value={testName}
          onChange={(e) => setTestName(e.target.value)}
          style={{ width: '300px' }}
        />
        <Input
          type="datetime-local"
          placeholder="Start Time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          style={{ width: '300px', marginLeft: '10px' }}
        />
        <Input
          type="datetime-local"
          placeholder="End Time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          style={{ width: '300px', marginLeft: '10px' }}
        />
        <Input
          type="number"
          placeholder="Duration (minutes)"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          style={{ width: '300px', marginLeft: '10px' }}
        />
      </div>
      <div className="selected-questions">
        <ul>
          {selectedTechnicalQuestions.map((question) => (
            <li key={question.id}>
              {question.question} (Technical)
              <Button onClick={() => handleRemoveSelected(question.id, "technical")}>Remove</Button>
            </li>
          ))}
          {selectedVerbalQuestions.map((question) => (
            <li key={question.id}>
              {question.question} (Verbal)
              <Button onClick={() => handleRemoveSelected(question.id, "verbal")}>Remove</Button>
            </li>
          ))}
          {selectedAptitudeQuestions.map((question) => (
            <li key={question.id}>
              {question.question} (Aptitude)
              <Button onClick={() => handleRemoveSelected(question.id, "aptitude")}>Remove</Button>
            </li>
          ))}
        </ul>
      </div>
      <Button primary onClick={handleSubmit}>Submit</Button>
    </div>
  );
};

export default SetExam;
