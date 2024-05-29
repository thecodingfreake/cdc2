import React, { useState, useEffect, useContext } from "react";
import "./Questionpage.css";
import Logo from "./assets/logo.png";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { dashContext } from "./userContext";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const Questionpage = () => {
  const { id } = useParams();
  const { userstate } = useContext(dashContext);
  const [question, setQuestion] = useState([]);
  const navigate = useNavigate();
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [totalQuestion, setTotalQuestion] = useState(0);
  const [markedForReview, setMarkedForReview] = useState([]);
  const [answeredQuestions, setAnsweredQuestions] = useState([]);
  const [timer, setTimer] = useState(3600); // Timer set to 60 minutes (3600 seconds)
  const [t, setT] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [firstTimeStart, setFirstTimeStart] = useState(false);
  const [voluntarySubmission, setVoluntarySubmission] = useState(false); // Track voluntary submission

  useEffect(() => {
    axios
      .get(`http://localhost:5000/check/${id}/${userstate.email}`)
      .then((response) => {
        if (response.data === "done") {
          navigate("/");
        }
      });
  }, [id, navigate, userstate.email]);

  useEffect(() => {
    const fetchQuestion = async () => {
      try {
        const questionData = await axios.get(
          `http://localhost:5000/get_question/${id}`
        );
        const shuffledQuestions = shuffleArray(questionData.data.questions);
        setQuestion(shuffledQuestions);
        setTotalQuestion(shuffledQuestions.length);
        setSelectedAnswers(Array(shuffledQuestions.length).fill([]));
        setT(questionData.data.duration);
      } catch (err) {
        console.log(err);
      }
    };
    fetchQuestion();
  }, [id]);

  const shuffleArray = (array) => {
    const shuffledArray = [...array];
    for (let i = shuffledArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    }
    return shuffledArray;
  };

  const handleSelect = (questionId, optionId, isFillInTheBlank = false) => {
    const updatedSelectedAnswers = [...selectedAnswers];

    if (isFillInTheBlank) {
      updatedSelectedAnswers[questionId] = [optionId];
    } else if (question[questionId].type === "Multiple Select") {
      if (updatedSelectedAnswers[questionId]) {
        if (updatedSelectedAnswers[questionId].includes(optionId)) {
          updatedSelectedAnswers[questionId] = updatedSelectedAnswers[questionId].filter(
            (item) => item !== optionId
          );
        } else {
          updatedSelectedAnswers[questionId] = [
            ...updatedSelectedAnswers[questionId],
            optionId,
          ];
        }
      } else {
        updatedSelectedAnswers[questionId] = [optionId];
      }
    } else {
      updatedSelectedAnswers[questionId] = [optionId];
    }

    setSelectedAnswers(updatedSelectedAnswers);

    const updatedAnsweredQuestions = [...answeredQuestions];
    updatedAnsweredQuestions[questionId] = true;
    setAnsweredQuestions(updatedAnsweredQuestions);
  };

  const generateResponseSheet = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Test Response Sheet", 14, 22);

    const tableData = question.map((q, index) => {
      const userAnswer = selectedAnswers[index] ? selectedAnswers[index].join(", ") : "N/A";
      return [
        q.question,
        q.answer.join(", "),
        userAnswer,
      ];
    });

    doc.autoTable({
      head: [["Question", "Correct Answer", "Your Answer"]],
      body: tableData,
      startY: 30,
    });

    doc.save("response-sheet.pdf");
  };

  const handleSubmit = (voluntary = true) => {
    if (voluntary) {
      setVoluntarySubmission(true);
    }

    const correctAnswersCount = question.filter((question, index) => {
      if (Array.isArray(question.answer)) {
        if (question.type === "Multiple Select") {
          return question.answer.sort().join(",") === (selectedAnswers[index] || []).sort().join(",");
        } else if (question.type === "Fill Up") {
          return question.answer[0] === selectedAnswers[index]?.[0];
        } else {
          return question.answer.includes(selectedAnswers[index]?.[0]);
        }
      } else {
        return false;
      }
    }).length;

    const scorePercentage = (correctAnswersCount / question.length) * 100;
    alert(
      `Your score: ${correctAnswersCount}/${
        question.length
      } (${scorePercentage.toFixed(2)}%)`
    );
    const score = {
      score: correctAnswersCount,
    };
    axios
      .post(`http://localhost:5000/addscore/${id}/${userstate.email}`, score)
      .then((res) => {
        if (res.data === "done") {
          generateResponseSheet();
          navigate("/");
        }
      })
      .catch();
  };

  const handleClear = (index) => {
    const updatedSelectedAnswers = [...selectedAnswers];
    updatedSelectedAnswers[index] = [];
    setSelectedAnswers(updatedSelectedAnswers);

    const updatedAnsweredQuestions = [...answeredQuestions];
    updatedAnsweredQuestions[index] = false;
    setAnsweredQuestions(updatedAnsweredQuestions);

    var ele = document.getElementsByName(`option-${index}`);
    for (var i = 0; i < ele.length; i++) ele[i].checked = false;
  };

  const handleMarkForReview = (index) => {
    const updatedMarkedForReview = [...markedForReview];
    updatedMarkedForReview[index] = true;
    setMarkedForReview(updatedMarkedForReview);
  };

  function enterFullScreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(
          `Error attempting to enable full-screen mode: ${err.message} (${err.name})`
        );
      });
    }
  }

  function exitFullScreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch((err) => {
        console.error(
          `Error attempting to exit full-screen mode: ${err.message} (${err.name})`
        );
      });
    }
  }

  function handleStartTest() {
    setHasStarted(true);
    enterFullScreen();
    setTimeout(() => {
      setFirstTimeStart(true);
    }, 500);
  }

  useEffect(() => {
    function handleFullscreenChange() {
      if (!document.fullscreenElement) {
        setIsFullScreen(false);
        if (hasStarted && !voluntarySubmission) {
          setShowAlert(true);
          handleSubmit(true);
        }
      } else {
        setIsFullScreen(true);
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [hasStarted, voluntarySubmission]);

  const handleVisibilityChange = () => {
    if (document.hidden) {
      alert("You have switched tabs! The test will now be submitted.");
      handleSubmit(false);
    }
  };

  useEffect(() => {
    const handleRightClick = (e) => {
      e.preventDefault();
    };

    const handleCopyPaste = (e) => {
      e.preventDefault();
    };

    const handleKeyDown = (e) => {
      if (e.ctrlKey && (e.key === "c" || e.key === "v")) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleRightClick);
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleRightClick);
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (hasStarted && timer > 0) {
      const countdown = setInterval(() => {
        setTimer((prevTimer) => prevTimer - 1);
      }, 1000);

      return () => clearInterval(countdown);
    } else if (timer === 0) {
      alert("Time's up! The test will now be submitted.");
      handleSubmit(false);
    }
  }, [hasStarted, timer]);

  // Format the timer as MM:SS
  const formatTimer = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        userSelect: "none" // Disable text selection
      }}
    >
      {!hasStarted ? (
        <div style={{ margin: "auto" }}>
          <button onClick={handleStartTest}>Start Test</button>
        </div>
      ) : isFullScreen ? (
        <>
          <div className="left-column">
            <div
              style={{ display: "flex", justifyContent: "center", gap: "1rem" }}
            >
              <img
                src={Logo}
                alt="Logo"
                style={{ width: "100px", height: "100px" }}
              />
              <h1
                style={{
                  textAlign: "center",
                  fontFamily: "montserrat",
                  margin: "auto 0",
                  color: "white",
                }}
              >
                Question
              </h1>
            </div>

            <div
              className="div2"
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <hr style={{ flex: 1, marginRight: "10px" }} />
              <p style={{ color: "gray", fontFamily: "montserrat" }}>
                QUESTION
              </p>
              <hr style={{ flex: 1, marginLeft: "10px" }} />
            </div>

            <div
              className="mainGrid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5,1fr)",
                gap: "10px",
              }}
            >
              {Array.from({ length: totalQuestion }, (_, index) => (
                <a
                  key={index}
                  href={`#${index}`}
                  style={{ color: "blue", textDecoration: "none" }}
                >
                  <button
                    style={{
                      fontFamily: "montserrat",
                      width: "100%",
                      backgroundColor: markedForReview[index]
                        ? "orange"
                        : answeredQuestions[index]
                        ? "green"
                        : "blue",
                    }}
                    className="button"
                  >
                    {index + 1}
                  </button>
                </a>
              ))}
            </div>
            <hr />

            <div className="timer">
              <h2>{formatTimer(timer)}</h2>
            </div>

            <div className="rightButtons">
              <button onClick={() => handleSubmit(true)}>Submit</button>
            </div>
          </div>

          <div className="right-column" style={{ overflowY: "hidden" }}>
            {question &&
              question.map((question, index) => (
                <div
                  id={index}
                  key={index}
                  style={{ height: "100vh", padding: "50px 0" }}
                >
                  <p
                    style={{
                      textAlign: "center",
                      color: "white",
                      fontFamily: "montserrat",
                      fontWeight: "500",
                      marginBottom: "30px",
                    }}
                  >
                    {index + 1} | {question.length}
                  </p>

                  <h2
                    style={{
                      textAlign: "left",
                      paddingLeft: "40px",
                      color: "white",
                      fontFamily: "montserrat",
                      fontWeight: "400",
                      marginBottom: "50px",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {question.question}
                  </h2>

                  {question.type === "Fill Up" ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "15px",
                      }}
                    >
                      <input
                        type="text"
                        name={`option-${index}`}
                        onChange={(e) =>
                          handleSelect(index, e.target.value, true)
                        }
                        style={{
                          padding: "10px",
                          maxWidth: "350px",
                          marginLeft: "350px",
                          borderRadius: "8px",
                        }}
                      />
                    </div>
                  ) : (
                    question.options &&
                    question.options.map((option, optionIndex) => (
                      <ul
                        key={optionIndex}
                        style={{ listStyleType: "none", padding: 0 }}
                      >
                        <li
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: "15px",
                            backgroundColor: "white",
                            padding: "10px",
                            maxWidth: "350px",
                            marginLeft: "350px",
                            borderRadius: "8px",
                          }}
                        >
                          {question.type === "Multiple Select" ? (
                            <label
                              style={{
                                marginRight: "10px",
                                width: "100%",
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <input
                                type="checkbox"
                                name={`option-${index}`}
                                value={option}
                                onChange={() => handleSelect(index, option)}
                                style={{ marginLeft: "10px" }}
                              />
                              {option}
                              <p></p>
                            </label>
                          ) : (
                            <label
                              style={{
                                marginRight: "10px",
                                width: "100%",
                                display: "flex",
                                justifyContent: "space-between",
                              }}
                            >
                              <input
                                type="radio"
                                name={`option-${index}`}
                                value={option}
                                onChange={() => handleSelect(index, option)}
                                style={{ marginLeft: "10px" }}
                              />
                              {option}
                              <p></p>
                            </label>
                          )}
                        </li>
                      </ul>
                    ))
                  )}

                  <div className="questionButtons">
                    <button className="b1" onClick={() => handleClear(index)}>
                      Clear Response
                    </button>
                    <button
                      className="b2"
                      onClick={() => handleMarkForReview(index)}
                    >
                      Mark for Review & Next
                    </button>
                    <button className="b4">Save & Mark for review</button>
                    {index !== totalQuestion - 1 && (
                      <button className="b3">
                        <a
                          href={`#${index + 1}`}
                          style={{ color: "white", textDecoration: "none" }}
                        >
                          Save & Next
                        </a>
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </>
      ) : firstTimeStart ? (
        <div className="flex justify-center items-center h-screen">
          <div className="text-center text-red-700">
            <p>Normal window is not allowed during the test.</p>
            <button onClick={enterFullScreen}>Go Back to Fullscreen</button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Questionpage;
