import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import './SingleCameraPage.css';
import ReactHlsPlayer from 'react-hls-player';
import { useParams, useNavigate } from 'react-router-dom';

const SingleCameraPage = () => {
  const { id } = useParams();
  const [camera, setCamera] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCameraData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return setError('No access token found');

        const response = await fetch(`http://localhost:5000/api/cameras/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch camera data');
        }

        const data = await response.json();
        setCamera(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCameraData();
  }, [id]);

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!camera) {
    return <div>No camera data available.</div>;
  }

  return (
    <div className='single-camera-page'>
      <Sidebar />
      <main className="main-content">
        <div className="back">
          <button onClick={handleGoBack}>&lt; Go Back</button>
        </div>
        <div className="header">{camera.name}</div>
        <div className="top">
          <div className="left">
            <div className="top-content">
              <p>Active Trackers</p>
              <button>+</button>
            </div>
            <div className="bottom-content">
              <p>You don't have any active trackers. Add now!</p>
              <button>Add</button>
            </div>
          </div>
          <div className="video-container">
            <ReactHlsPlayer
              src={camera.stream_url}
              autoPlay={true}
              controls={false}
              width="100%"
              height="100%"
            />
          </div>
        </div>
        <div className="bottom">
          <div className="top-content">Events</div>
          <div className="bottom-content">No events have been recorded yet</div>
        </div>
      </main>
    </div>
  );
};

export default SingleCameraPage;
