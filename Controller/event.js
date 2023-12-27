const User = require("../Models/user");
const Ticket = require("../Models/ticketSchema");
const jwt = require("jsonwebtoken");
const Attendee = require("../Models/attendeeSchema");
const Event = require("../Models/event");
const Bid = require("../Models/bid");
const fs = require("fs");
const createEvent = async (req, res) => {
  const {
    eventName,
    eventType,
    dateTime,
    venue,
    maxTicketsRegular,
    maxTicketsVip,
    priceOfRegularTicket,
    priceOfVipTicket,
    ticketAvailability,
    pic,
    servicesType,
    organizerEmail,
    feedbackAndRatings,
    title,
    description,
    schedule,
    attendeeList,
    eventUpdates,
    totalrevenue,
  } = req.body;

  try {
    const event = await Event.create({
      eventName,
      eventType,
      dateTime,
      venue,
      maxTicketsRegular,
      maxTicketsVip,
      priceOfRegularTicket,
      priceOfVipTicket,
      ticketAvailability,
      pic,
      servicesType,
      createdAt: new Date(),
      title,
      description,
      organizerEmail,
      feedbackAndRatings,
      schedule,
      attendeeList,
      eventUpdates,
      totalrevenue,
    });

    res.status(200).json({ event });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
};
const getEvents = async (req, res) => {
  try {
    const events = await Event.find({ approve: false });
    res.status(200).json({ events });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
};
const getApprovedEvents = async (req, res) => {
  try {
    const events = await Event.find({ approve: true });
    res.status(200).json({ events });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
};
const removeEvent = async (req, res) => {
  try {
    const { id } = req.body;
    const event = await Event.findOneAndRemove({ _id: id });
    res.status(200).json({ event });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
};
const approveEvent = async (req, res) => {
  try {
    const { id } = req.body;
    const event = await Event.findOneAndUpdate({ _id: id }, { approve: true });
    res.status(200).json({ event });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
};
const rejectEvent = async (req, res) => {
  try {
    const { id } = req.body;
    const event = await Event.findByIdAndRemove({ _id: id });
    res.status(200).json({ event });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
};
const getTopEvents = async (req, res) => {
  try {
    const event = await Event.find({ status: "upcoming" })
      .sort({ rating: -1 })
      .limit(10);
    const events = [];
    event.forEach((event) => {
      if (event.description != null) {
        events.push(event);
      }
    });

    res.status(200).json({ events });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
};
const getspecificEvent = async (req, res) => {
  try {
    const id = req.params.id;
    const event = await Event.findById({ _id: id });
    res.status(200).json({ event });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
};
const getEventCustomer = async (req, res) => {
  try {
    const id = req.params.id;
    const ticket = await Ticket.find({ eventId: id });
    const data = [];
    for (let i = 0; i < ticket.length; i++) {
      const attendee = await Attendee.findById({ _id: ticket[i].attendeeId });
      const user = await User.findOne({ email: attendee.email });
      data.push({
        name: attendee.name,
        email: attendee.email,
        type: ticket[i].type,
        pic: user.pic,
      });
    }
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
};
function getDatesForLastSevenDays() {
  const dateArray = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const currentDate = new Date();
    currentDate.setDate(today.getDate() - i);
    console.log(currentDate.toISOString().split("T")[0]);
    dateArray.push(currentDate.toISOString().split("T")[0]);
  }
  return dateArray;
}
const findTopEventOrganizers = async (req, res) => {
  try {
    const eventList = await Event.find({ approve: true });
    const organizerCounts = {};
    eventList.forEach((event) => {
      const organizerEmail = event.organizerEmail;
      organizerCounts[organizerEmail] =
        (organizerCounts[organizerEmail] || 0) + 1;
    });
    const sortedCounts = Object.entries(organizerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    const topOrganizers = sortedCounts.map(([email, count]) => ({
      email,
      count,
    }));
    const data = [];
    for (let i = 0; i < topOrganizers.length; i++) {
      const user = await User.findOne({ email: topOrganizers[i].email });
      data.push({
        name: user?.name,
        email: user?.email,
        pic: user?.pic ?? "path_to_default_image.jpg",
        count: topOrganizers[i].count,
      });
    }
    console.log(data);
    res.status(200).json({ data });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
};
const eventSale = async (req, res) => {
  const result = getDatesForLastSevenDays();
  try {
    const ticket = await Ticket.find();
    const row = [];
    result.forEach((date) => {
      row[date] = 0;
    });
    ticket.forEach((ticket) => {
      const date = ticket.purchaseDate.toISOString().split("T")[0];
      if (result.includes(date)) {
        row[date] = ticket.price + (row[date] || 0);
      }
    });
    const data = Object.entries(row).map(([time, amount]) => ({
      time,
      amount,
    }));
    const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
    console.log(data);
    res.status(200).json({ data: data.reverse(), totalAmount });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
};
function formatDate(date) {
  const dateObject = new Date(date);
  const year = dateObject.getFullYear();
  const month = (dateObject.getMonth() + 1).toString().padStart(2, "0");
  const day = dateObject.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}
function getDates(startDate, endDate) {
  const dateArray = [];
  let currentDate = new Date(startDate);
  const endDateTime = new Date(endDate);

  while (currentDate.getTime() <= endDateTime.getTime()) {
    dateArray.push(formatDate(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dateArray;
}

const getspecificEventSale = async (req, res) => {
  try {
    const id = req.params.id;
    const event = await Event.findOne({ _id: id });
    const startDate = event.createdAt.toISOString().split("T")[0];
    // const currentDate = new Date();
    // currentDate.setDate(currentDate.getDate() + 1);
    //const endDate = currentDate.toISOString().split("T")[0];
    const endDate = new Date().toISOString().split("T")[0];
    console.log(startDate, endDate);
    const result = getDates(startDate, endDate);
    console.log(result);
    const ticket = await Ticket.find({ eventId: event._id });
    const row = [];
    result.forEach((date) => {
      row[date] = 0;
    });
    ticket.forEach((ticket) => {
      const date = ticket.purchaseDate.toISOString().split("T")[0];
      if (result.includes(date)) {
        row[date] = ticket.price + (row[date] || 0);
      }
    });
    const data = Object.entries(row).map(([time, amount]) => ({
      time,
      amount,
    }));
    console.log(data);
    const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
    res.status(200).json({ data: data, totalAmount });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
};
const eventRevenue = async (req, res) => {
  const result = getDatesForLastSevenDays();
  try {
    const ticket = await Ticket.find();
    const row = [];
    const row1 = [];
    result.forEach((date) => {
      row[date] = 0;
      row1[date] = 0;
    });
    ticket.forEach((ticket) => {
      const date = ticket.purchaseDate.toISOString().split("T")[0];
      if (result.includes(date)) {
        row[date] = ticket.price + (row[date] || 0);
      }
    });
    const data = Object.entries(row).map(([time, amount]) => ({
      time,
      amount,
    }));
    const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
    console.log(data);
    const bid = await Bid.find({ status: "accepted" });
    bid.forEach((data) => {
      const date = data.dateSubmitted.toISOString().split("T")[0];
      if (result.includes(date)) {
        row1[date] = data.bidAmount + (row1[date] || 0);
      }
    });
    const data2 = Object.entries(row1).map(([date, expend]) => ({
      date,
      expend,
    }));
    const revenue = [];
    data2.forEach((item, index) => {
      if (item.date === data[index].time) {
        revenue.push({
          label: item.date,
          value: (data[index].amount || 0) - item.expend,
        });
      }
    });
    revenue.reverse();
    const totalRevenue = revenue.reduce((sum, item) => sum + item.value, 0);
    res.status(200).json({ revenue, totalRevenue });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
};
const getspecificEventRevenue = async (req, res) => {
  try {
    const id = req.params.id;
    const event = await Event.findOne({ _id: id });
    const startDate = event.createdAt.toISOString().split("T")[0];
    const endDate = new Date().toISOString().split("T")[0];

    const result = getDates(startDate, endDate);

    const ticket = await Ticket.find({ eventId: event._id });
    const row = {};
    result.forEach((date) => {
      row[date] = 0;
    });

    ticket.forEach((ticket) => {
      const date = ticket.purchaseDate.toISOString().split("T")[0];
      if (result.includes(date)) {
        row[date] = ticket.price + (row[date] || 0);
      }
    });
    const data = Object.entries(row).map(([time, amount]) => ({
      time,
      amount,
    }));
    const bid = await Bid.find({ status: "accepted", eventId: id });
    console.log(bid);
    const row1 = {};
    result.forEach((date) => {
      row1[date] = 0;
    });

    bid.forEach((data) => {
      const date = data.dateSubmitted.toISOString().split("T")[0];
      if (result.includes(date)) {
        row1[date] = data.bidAmount + (row1[date] || 0);
      }
    });
    const data2 = Object.entries(row1).map(([date, expend]) => ({
      date,
      expend,
    }));
    const revenue = [];
    data2.forEach((item) => {
      const correspondingData = data.find((d) => d.time === item.date);
      revenue.push({
        label: item.date,
        value: (correspondingData ? correspondingData.amount : 0) - item.expend,
      });
    });
    const totalRevenue = revenue.reduce((sum, item) => sum + item.value, 0);
    res.status(200).json({ revenue, totalRevenue });
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
};

module.exports = {
  createEvent,
  getEvents,
  getApprovedEvents,
  findTopEventOrganizers,
  removeEvent,
  eventSale,
  getspecificEventSale,
  approveEvent,
  rejectEvent,
  getTopEvents,
  eventRevenue,
  getspecificEvent,
  getEventCustomer,
  getspecificEventRevenue,
};
