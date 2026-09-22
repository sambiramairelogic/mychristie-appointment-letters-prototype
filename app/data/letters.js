const { format, isDate, parseISO } = require('date-fns');

const today = new Date();
const daysAgo = (days) => {
  const date = new Date(today);
  date.setDate(date.getDate() - days);
  return date;
};

const clinicians = [
  "Dr. Bashir",
  "Dr. Phlox",
  "Dr. Crusher",
  "Dr. McCoy",
  "Dr. Pulaski",
  "EMH",
];

const formatDisplayDate = (
  date,
) => {
  if (isDate(date)) {
    return format(date, 'dd MMM yyyy');
  }

  return format(parseISO(date.toString()), 'dd MMM yyyy');
};



const letterTypes = ["Outcome", "Appointment"];

const specialties = ["Radiotherapy", "Psycho-oncology", "Phlebotomy"];

const allLetters = Array.from({ length: 50 }, (_, i) => {
  const letterType = letterTypes[i % letterTypes.length];

  if (letterType === "Outcome") {
    return {
      type: letterType,
      status: i % 3 === 0 ? "read" : "unread",
      author: clinicians[i % clinicians.length],
      dateSent: formatDisplayDate(daysAgo(i % 21)),
    };
  }

  return {
    type: letterType,
    status: i % 3 === 0 ? "read" : "unread",
    specialty: specialties[i % specialties.length],
    appointmentDate: formatDisplayDate(daysAgo(i % 21)),
  };
});

const outcomeLetters = allLetters.filter((letter) => letter.type === "Outcome");
const appointmentLetters = allLetters.filter((letter) => letter.type === "Appointment");

module.exports = {
  allLetters,
  outcomeLetters,
  appointmentLetters,
  formatDisplayDate,
};
