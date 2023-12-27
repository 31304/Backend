const express = require('express');
const authenticateUser = require('../Authentication/Authentication');
const Attendee = require('../Models/attendeeSchema');

const router = express.Router();

router.get('/event-update', authenticateUser, async (req, res) => {
    const attendeeEmail = req.email;
  
    try {
      const attendee = await Attendee.findOne({ email: attendeeEmail });
  
      if (!attendee) {
        return res.status(404).json({ message: 'Attendee not found' });
      }
  
      const eventUpdateNotifications = attendee.notifications.filter(
        (notification) => notification.type === 'eventUpdate' 
      );
  
      res.status(200).json({ eventUpdateNotifications });
    } catch (error) {
      res.status(500).json({ message: 'Internal Server Error' + error });
    }
  });

  router.get('/event-cancellation', authenticateUser, async (req, res) => {
    const attendeeEmail = req.email;
  
    try {
      const attendee = await Attendee.findOne({ email: attendeeEmail });
  
      if (!attendee) {
        return res.status(404).json({ message: 'Attendee not found' });
      }
  
      const eventCancelNotifications = attendee.notifications.filter(
        (notification) => notification.type === 'cancellation'
      );
  
      res.status(200).json({ eventCancelNotifications });
    } catch (error) {
      res.status(500).json({ message: 'Internal Server Error' + error });
    }
  });

  router.get('/new-event', authenticateUser, async (req, res) => {
    const attendeeEmail = req.email;
  
    try {
      const attendee = await Attendee.findOne({ email: attendeeEmail });
  
      if (!attendee) {
        return res.status(404).json({ message: 'Attendee not found' });
      }
  
      const eventNewNotifications = attendee.notifications.filter(
        (notification) => notification.type === 'newEvent'
      );
      
      res.status(200).json({ eventNewNotifications });
    } catch (error) {
      res.status(500).json({ message: 'Internal Server Error' + error });
    }
  });


  router.post('/isReadById', authenticateUser, async (req, res) => {
    const attendeeEmail = req.email;
    try {
      const { notificationId } = req.body;

      const attendee = await Attendee.findOne({ email: attendeeEmail });
  
      if (!attendee) {
        return res.status(404).json({ message: 'Attendee not found' });
      }

      let flag=false;

      for(let i=0;i<attendee.notifications.length;i++){
           if(attendee.notifications[i]._id.toString()===notificationId){
            attendee.notifications[i].isRead=true;
            attendee.save();
            flag=true;
           }
      }
      
      if(flag){
        res.status(200).json({ message: 'Notification updated successfully' });
      }
      else{
        res.status(400).json({ message: 'Notification not found' });
      }
     
    } catch (error) {
      res.status(500).json({ message: 'Internal Server Error' + error });
    }
  });
  module.exports = router;
  