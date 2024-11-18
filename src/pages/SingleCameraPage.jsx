import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import './SingleCameraPage.css';
import ReactHlsPlayer from 'react-hls-player';
import { useParams, useNavigate } from 'react-router-dom';
import Webcam from "react-webcam";
import io from 'socket.io-client';

const socket = io('https://51db-2406-7400-9a-9131-39f7-d58e-48c9-4f3b.ngrok-free.app', {
  transports: ['websocket'],
});
socket.on('connect', () => {
  console.log('Socket connected: ', socket.id);
});

const SingleCameraPage = () => {
  const { id } = useParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [camera, setCamera] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errors, setErrors] = useState({ tracker: '' });
  const [tracker, setTracker] = useState('');
  const [activeTrackers, setActiveTrackers] = useState([]);
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setTracker('');
    setErrors({ tracker: '' });
  };

  const addTracker = () => {
    let isValid = true;
    let newErrors = { tracker: '' };

    if (!tracker) {
      newErrors.tracker = 'Description is required.';
      isValid = false;
    }

    setErrors(newErrors);

    if (isValid) {
      console.log('Tracker added:', tracker);
      const updatedTrackers = [...activeTrackers, tracker];
      setActiveTrackers(updatedTrackers);
      localStorage.setItem('activeTrackers', JSON.stringify(updatedTrackers));
      setTracker('');
      setIsModalOpen(false);

      if (camera) {
        const payload = {
          "cameraId": camera.name,
          "trackers": updatedTrackers,
          "streamUrl": camera.stream_url
        };

        console.log('Start tracking request body:', JSON.stringify(payload));
        socket.emit('start_tracking', payload);
      }
    }
  };

  const clearTrackers = () => {
    setActiveTrackers([]);
    socket.emit('stop_tracking');
    localStorage.removeItem('activeTrackers');
    setTimeout(() => {
      setEvents([]);
    }, 200);
  };

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "user",
  };

  useEffect(() => {
    socket.emit('stop_tracking');
  }, []);

  useEffect(() => {
    const storedTrackers = localStorage.getItem('activeTrackers');
    if (storedTrackers) {
      setActiveTrackers(JSON.parse(storedTrackers));
    }
  }, []);

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

  useEffect(() => {
    socket.on('tracking_data', (data) => {
      console.log('Tracking data received:', data);
      // Update the events list with the latest data
      setEvents((prevEvents) => {
        const newEvents = [...prevEvents];
        data.data.forEach((trackerData) => {
          const existingTracker = newEvents.find((event) => event.name === trackerData.trackerName);
          if (existingTracker) {
            existingTracker.confidence = trackerData.confidence; // Update confidence if tracker exists
          } else {
            newEvents.push({ name: trackerData.trackerName, confidence: trackerData.confidence });
          }
        });
        return newEvents;
      });
    });

    return () => {
      socket.off('tracking_data');
    };
  }, []);

  const handleGoBack = () => {
    navigate(-1);
  };

  const handleStopTracking = () => {
    socket.emit('stop_tracking', { cameraId: camera.name });
  };

  const handleStartTracking = () => {
    if (camera && activeTrackers.length > 0) {
      const payload = {
        cameraId: camera.name,
        trackers: activeTrackers,
        streamUrl: camera.stream_url
      };
      socket.emit('start_tracking', payload);
    }
  };

  const getBarWidth = (confidence, isHighest) => {
    if (confidence <= 0) return 0;

    // If the confidence is below the minimum threshold, don't normalize
    if (confidence <= 0.001) return confidence * 1000;

    // Check if this is the highest value (first item in sorted list)
    if (isHighest) {
      // Cap the width at 85% for the highest value
      const logConfidence = Math.log10(confidence + 1e-10);
      const minLog = Math.log10(1e-10);
      const maxLog = Math.log10(1);
      const width = ((logConfidence - minLog) / (maxLog - minLog)) * 100;

      // Ensure the width doesn't exceed 85%
      return Math.min(width, 85);
    }

    // For other values, apply the normal normalization logic
    const logConfidence = Math.log10(confidence + 1e-10);
    const minLog = Math.log10(1e-10);
    const maxLog = Math.log10(1);
    const width = ((logConfidence - minLog) / (maxLog - minLog)) * 100;

    return Math.max(0, Math.min(100, width));
  };

  const sortedEvents = [...events].sort((a, b) => b.confidence - a.confidence);

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
              <button onClick={openModal}>+</button>
            </div>
            <div className="bottom-content">
              {activeTrackers.length === 0 ? (
                <p>You don't have any active trackers. Add now!</p>
              ) : (
                <div className="trackers-container">
                  {activeTrackers.map((tracker, index) => (
                    <div className="tracker" key={index}>{tracker}</div>
                  ))}
                </div>
              )}
              {
                activeTrackers.length === 0 && (<button onClick={openModal}>Add</button>)
              }
            </div>
            <div className="tracker-buttons">
              {activeTrackers.length > 0 && (
                <>
                  <button id='start-tracking-btn' onClick={handleStartTracking}>Start Tracking</button>
                  <button id='stop-tracking-btn' onClick={handleStopTracking}>Stop Tracking</button>
                  <button id='clear-all-btn' onClick={clearTrackers}>Clear All</button>
                </>
              )}
            </div>
          </div>
          <div className="video-container">
            {camera.stream_url === "webcam" ? (
              <Webcam
                audio={false}
                controls={true}
                videoConstraints={videoConstraints}
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <ReactHlsPlayer
                src={camera.stream_url}
                autoPlay={true}
                controls={false}
                width="100%"
                height="100%"
              />
            )}
          </div>
        </div>
        <div className="bottom">
          <div className="top-content">Events</div>
          <div className="bottom-content">
            {sortedEvents.length === 0 ? (
              <p>No events have been recorded yet</p>
            ) : (
              <div className="events-list">
                {sortedEvents.map((event, index) => (
                  <div className="event" key={index}>
                    <span>{event.name}</span>
                    <div className="bar-container">
                      <div
                        className="confidence-bar"
                        style={{
                          width: `${getBarWidth(event.confidence, index === 0)}%`,
                          backgroundColor: index === 0 ? 'rgba(80, 200, 120, 255)' : 'rgba(35, 131, 205, 255)',
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Add a new tracker</h2>
                <button className="close-btn" onClick={closeModal}>x</button>
              </div>

              <label>Description</label>
              <input
                type="text"
                value={tracker}
                placeholder='Person jumping over the wall'
                onChange={(e) => setTracker(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTracker();
                  }
                }}
                required
              />
              {errors.tracker && <p className="error-message">{errors.tracker}</p>}

              <div className="modal-actions">
                <button className="add-btn" onClick={addTracker}>Add</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SingleCameraPage;
