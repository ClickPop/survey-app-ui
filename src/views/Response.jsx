import * as axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
// import defaultAvatar from '../images/default-avatar.png';

const surveyEnd = (survey, cursor) => {
  return (
    (!survey.respondent && cursor > survey.questions?.length - 1) ||
    (survey.respondent && cursor > survey.questions?.length)
  );
};

const getQuery = (qStr) => {
  if (!/\?(\S+=\S+)+/g.test(qStr)) return null;
  const arr = qStr.slice(1, qStr.length).split('=');
  const query = [];
  for (let i = 0; i < arr.length; i += 2) {
    query.push({
      key: arr[i],
      value: arr[i + 1],
      type: 'query',
    });
  }
  return query;
};

export const Response = ({ history, location }) => {
  const params = useParams();
  const [survey, setSurvey] = useState({});
  // const [avatar, setAvatar] = useState(defaultAvatar);
  const [cursor, setCursor] = useState(0);
  const [queryResponses, setQueryResponses] = useState([]);
  const [responses, setResponses] = useState([]);
  const [respondent, setRespondent] = useState('');
  const [responseId, setResponseId] = useState(null);
  const [currentResponse, setCurrentResponse] = useState({ value: '' });

  useEffect(() => {
    const getSurvey = async () => {
      try {
        const surv = await axios.get(`/api/v1/surveys/${params.hash}`);
        setSurvey(surv.data.result);
        const queryParams = getQuery(decodeURI(location.search));
        const resp = JSON.parse(localStorage.getItem('resp'));
        if (resp) {
          setResponses([
            ...resp.data.filter((response) => response.type !== 'query'),
          ]);
        }
        if (!queryParams) return;
        setQueryResponses((r) => [...r, ...queryParams]);
      } catch (err) {
        console.error(err);
        // TODO add error popup
      }
    };
    getSurvey();
  }, [params.hash, location.search]);

  useEffect(() => {
    const sendSurveys = async () => {
      const resp = JSON.parse(localStorage.getItem('resp'));
      const cur = localStorage.getItem('cur');
      setResponseId(resp?.id);
      setCursor(cur || 0);
      if (cursor < 1 && !resp?.id) {
        try {
          const response = await axios.post('/api/v1/responses/new', {
            surveyId: survey.id,
            responses: [...responses, ...queryResponses],
            respondent: respondent,
          });
          setResponseId(response.data.result.id);
          localStorage.setItem('resp', JSON.stringify(response.data.result));
        } catch (err) {
          console.error(err);
          // TODO add error popup
        }
      } else if (cursor > 0 && responseId) {
        try {
          const res = await axios.patch('/api/v1/responses/update', {
            responseId: responseId,
            responses: [...responses, ...queryResponses],
            respondent: respondent,
          });
          localStorage.setItem('resp', JSON.stringify(res.data.result));
          if (surveyEnd(survey, cursor)) {
            localStorage.removeItem('resp');
            localStorage.removeItem('cur');
          }
        } catch (err) {
          console.error(err);
          // TODO add error popup
        }
      }
    };

    sendSurveys();
  }, [
    cursor,
    queryResponses,
    responses,
    survey.id,
    survey.questions,
    respondent,
    survey,
    responseId,
  ]);

  const handleChange = (e) => {
    setCurrentResponse({
      ...currentResponse,
      id: e.target.name,
      value: e.target.value,
    });
  };

  const handleName = (e) => {
    setRespondent(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cursor < survey.questions.length) {
      if (responses.find((response) => response.id === currentResponse.id)) {
        setResponses(
          responses.map((response) =>
            response.id === currentResponse.id ? currentResponse : response,
          ),
        );
      } else {
        setResponses([...responses, currentResponse]);
      }
      setCurrentResponse({ value: '' });
    }
    setCursor(cursor + 1);
    localStorage.setItem('cur', cursor + 1);
  };

  const handleKeypress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  const handleBack = () => {
    setCurrentResponse(responses[cursor - 1]);
    setCursor(cursor - 1);
  };

  return (
    <div className="survey d-flex py-md-4">
      {survey && (
        <div className="container p-0 d-flex flex-column survey__container">
          {/*
          <header className="no-gutters survey-chat__header">
            <figure className="avatar mini rounded-circle border border-primary overflow-hidden bg-light">
              <img src={avatar} alt="Survey Says" loading="lazy" />
            </figure>
            <h1 className="text-center survey-chat__title">{survey.title}</h1>
          </header>
          */}

          <div className="d-flex flex-column survey__feed">
            {survey.questions &&
              survey.questions.map(
                (question, i) =>
                  question.type !== 'query' &&
                  cursor >= i && (
                    <div className="survey__set" key={question.id}>
                      <div className="survey__question">
                        <h2 className="message">{question.prompt}</h2>
                      </div>

                      <div className="survey__response">
                        <p className="message">
                          {responses.length > 0 &&
                            i < cursor &&
                            responses[i].value}
                        </p>
                      </div>
                    </div>
                  ),
              )}
            {survey.respondent && cursor >= survey.questions.length && (
              <div className="survey__set">
                <div className="survey__question">
                  <h2 className="message">What can we call you?</h2>
                </div>
                {surveyEnd(survey, cursor) && (
                  <div className="survey__response">
                    <p className="message">{respondent}</p>
                  </div>
                )}
              </div>
            )}
            <div
              className="survey__set"
              style={{
                opacity: surveyEnd(survey, cursor) ? 1 : 0,
                transition: 'opacity 0.7s ease-in-out 0.5s',
              }}
            >
              <div className="survey__question">
                <p className="message">Thanks for answering!</p>
              </div>
            </div>
          </div>

          <div className="survey__footer">
            <div className="survey__answer">
              <div class="input-group">
                {!surveyEnd(survey, cursor) && survey.questions && (
                  <input
                    type="text"
                    name={
                      cursor < survey.questions.length
                        ? survey.questions[cursor].id
                        : 'respondent'
                    }
                    onChange={
                      survey.respondent && cursor >= survey.questions.length
                        ? handleName
                        : handleChange
                    }
                    value={
                      cursor < survey.questions.length
                        ? currentResponse.value
                        : respondent
                    }
                    onKeyPress={handleKeypress}
                    className="form-control"
                    autoFocus
                  />
                )}
                {!surveyEnd(survey, cursor) ? (
                  <button
                    className="btn btn-primary px-3"
                    name="submit"
                    onClick={handleSubmit}
                  >
                    &raquo;
                  </button>
                ) : (
                  <div className="text-center">
                    Make a survey of your own with <a href="#">Backtalk</a>
                  </div>
                )}
                {cursor > 0 && !surveyEnd(survey, cursor) && (
                  <button onClick={handleBack}>Back</button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
