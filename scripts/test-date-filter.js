
const appointmentDateStr = new Date().toISOString().split('T')[0]; // Today's date YYYY-MM-DD
const appointmentDate = new Date(appointmentDateStr);
const now = new Date();

console.log("Appointment Date String:", appointmentDateStr);
console.log("Appointment Date Object:", appointmentDate.toString());
console.log("Current Date Object:", now.toString());

const isUpcoming = appointmentDate >= now;
console.log("Is Upcoming (appointment >= now)?", isUpcoming);

// Fix Logic Test:
// We should compare midnight to midnight for date-only comparison
const todayMidnight = new Date();
todayMidnight.setHours(0, 0, 0, 0);
const isUpcomingFix = appointmentDate >= todayMidnight;
console.log("Is Upcoming Fix (appointment >= todayMidnight)?", isUpcomingFix);
