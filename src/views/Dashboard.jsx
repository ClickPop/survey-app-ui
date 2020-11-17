import React, { useContext, useEffect, useState } from 'react';
import { context } from '../context/Context';
import * as axios from 'axios';
import { Link, Redirect } from 'react-router-dom';
import { Trash2, ExternalLink, MessageCircle } from 'react-feather';
import NewSurvey from '../components/NewSurvey';
import { Modal } from '../components/Modal';
import decodeHtml from '../helpers/decodeHtml';

export const Dashboard = () => {
  const { state } = useContext(context);
  const [surveys, setSurveys] = useState(null);
  const [show, setShow] = useState(false);
  const [deleteResponse, setDeleteResponse] = useState(null);
  const [deleted, setDeleted] = useState(false);

  const handleDelete = async (id) => {
    try {
      const res = await axios({
        method: 'delete',
        url: '/api/v1/surveys/delete',
        headers: { Authorization: `Bearer ${state.token}` },
        data: {
          surveyId: id,
        },
      });
      setDeleted(res.data.deleted);
      handleModal(false);
    } catch (err) {
      console.error(err);
      //TODO add error popup
    }
  };

  const handleModal = (display, id) => {
    setDeleteResponse(display ? id : null);
    setShow(display);
  };

  useEffect(() => {
    let cancelled = false;
    const getSurveys = async () => {
      try {
        const userSurveys = await axios.get('/api/v1/surveys', {
          headers: { Authorization: `Bearer ${state.token}` },
        });
        if (!cancelled) {
          setSurveys(userSurveys.data.results);
        }
      } catch (err) {
        console.error(err);
      }
    };
    getSurveys();
    if (deleted) setDeleted(false);
    return () => {
      cancelled = true;
    };
  }, [state.token, deleted]);

  if (!state.auth) {
    return <Redirect to="/login" />;
  }

  if (state.loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="container">
      <div className="row">
        {surveys && surveys.length < 1 && !state.loading && (
          <Redirect to="/surveys/first" />
        )}
        <Modal
          show={show}
          handleModal={handleModal}
          title="Are you sure you want to delete this survey?"
        >
          <div className="d-flex justify-content-around">
            <button
              className="btn btn-lg btn-success"
              onClick={() => handleDelete(deleteResponse)}
            >
              Yes
            </button>
            <button
              className="btn btn-lg btn-danger"
              onClick={() => handleModal(false)}
            >
              No
            </button>
          </div>
        </Modal>
        <div className="col-12 order-sm-2 col-sm-6 col-lg-4">
          <h2 className="mb-4">New Survey</h2>
          <NewSurvey surveys={surveys} setSurveys={setSurveys} />
        </div>
        <div className="col-12 order-sm-1 col-sm-6 col-lg-8 pr-sm-4">
          <h1 className="mb-4">Your Surveys</h1>
          {surveys &&
            !state.loading &&
            surveys.map((survey) => (
              <div key={survey.id} className="row">
                <div className="col-12">
                  <div className="card card--hover p-3 mb-4">
                    <div className="card-body">
                      <div className="d-flex justify-content-between">
                        <h5 className="card-title">
                          <Link
                            to={`/responses/${survey.hash}`}
                            className="text-decoration-none"
                          >
                            {decodeHtml(survey.title)}
                          </Link>
                        </h5>
                        <button
                          type="button"
                          className="btn btn-inline response-preview__delete"
                          onClick={() => handleModal(true, survey.id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      <div className="mb-2 d-flex align-items-center">
                        <MessageCircle size={18} className="mr-2" />
                        {survey?.Responses?.length ? (
                          <Link
                            to={`/responses/${survey.hash}`}
                            className="text-decoration-none"
                          >
                            {survey.Responses.length} responses
                          </Link>
                        ) : (
                          'No responses yet'
                        )}
                      </div>
                      <div className="d-flex align-items-center">
                        <ExternalLink size={18} className="mr-2" />
                        <Link
                          to={`/survey/${survey.hash}`}
                          className="text-decoration-none"
                          target="_blank"
                        >{`${window.location.host}/survey/${survey.hash}`}</Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
