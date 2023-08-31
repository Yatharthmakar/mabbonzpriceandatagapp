export default function currentDate (offset=-330){
    // Get the current date
    let date = new Date();
    let utc = date.getTime() + (date.getTimezoneOffset() * 60000);
    let currentDate = new Date(utc - (60000*offset));

    // Get the year, month, and day
    let year = currentDate.getFullYear();
    let month = String(currentDate.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    let day = String(currentDate.getDate()).padStart(2, '0');

    // Get the hours, minutes, and seconds
    let hours = String(currentDate.getHours()).padStart(2, '0');
    let minutes = String(currentDate.getMinutes()).padStart(2, '0');
    let seconds = String(currentDate.getSeconds()).padStart(2, '0');

    // Get the time zone offset in minutes
    let timezoneOffsetMinutes = 60000*offset;

    // Convert the time zone offset to the format "+HH:mm"
    let timezoneOffsetHours = Math.floor(Math.abs(timezoneOffsetMinutes) / 60);
    let timezoneOffsetMinutesFormatted = String(Math.abs(timezoneOffsetMinutes) % 60).padStart(2, '0');
    let timezoneOffsetSign = timezoneOffsetMinutes < 0 ? '+' : '-'; // Determine the sign of the offset

    // Create the formatted date string
    let formattedDate = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}${timezoneOffsetSign}${timezoneOffsetHours}:${timezoneOffsetMinutesFormatted}`;

    return formattedDate;
}
