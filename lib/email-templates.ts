
export const getAppointmentConfirmationEmail = (patientName: string, doctorName: string, date: string, time: string) => {
    return `
    <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Appointment Confirmation</h2>
        <p>Dear ${patientName},</p>
        <p>Your appointment has been successfully booked.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Doctor:</strong> ${doctorName}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${time}</p>
        </div>
        <p>Please arrive 10 minutes before your scheduled time.</p>
        <p>Best regards,<br>MediFollow Team</p>
    </div>
    `
}

export const getAppointmentRequestEmail = (patientName: string, doctorName: string, date: string, time: string) => {
    return `
    <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Appointment Request Received</h2>
        <p>Dear ${patientName},</p>
        <p>Your appointment request has been received and is pending approval.</p>
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Doctor:</strong> ${doctorName}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${time}</p>
        </div>
        <p>You will receive another email once the doctor reviews your request.</p>
        <p>Best regards,<br>MediFollow Team</p>
    </div>
    `
}

export const getAppointmentApprovalEmail = (patientName: string, doctorName: string, date: string, time: string) => {
    return `
    <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Appointment Approved</h2>
        <p>Dear ${patientName},</p>
        <p>Great news! Your appointment request has been approved by Dr. ${doctorName}.</p>
        <div style="background-color: #e6fffa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Doctor:</strong> ${doctorName}</p>
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${time}</p>
        </div>
        <p>We look forward to seeing you.</p>
        <p>Best regards,<br>MediFollow Team</p>
    </div>
    `
}

export const getAppointmentRejectionEmail = (patientName: string, doctorName: string, date: string) => {
    return `
    <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Appointment Update</h2>
        <p>Dear ${patientName},</p>
        <p>Unfortunately, your appointment request with Dr. ${doctorName} for ${date} could not be accepted at this time.</p>
        <p>Please log in to your dashboard to choose a different time slot or doctor.</p>
        <p>Best regards,<br>MediFollow Team</p>
    </div>
    `
}

export const getAppointmentCancellationEmail = (recipientName: string, otherPartyName: string, date: string, time: string) => {
    return `
    <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Appointment Cancelled</h2>
        <p>Dear ${recipientName},</p>
        <p>The appointment with ${otherPartyName} scheduled for ${date} at ${time} has been cancelled.</p>
        <p>If this was a mistake, please book a new appointment.</p>
        <p>Best regards,<br>MediFollow Team</p>
    </div>
    `
}

export const getAppointmentReminderEmail = (recipientName: string, otherPartyName: string, date: string, time: string, status: string) => {
    return `
    <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Appointment Reminder</h2>
        <p>Dear ${recipientName},</p>
        <p>This is a reminder for your upcoming appointment with ${otherPartyName}.</p>
        <div style="background-color: #fff8e1; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Date:</strong> ${date}</p>
            <p><strong>Time:</strong> ${time}</p>
            <p><strong>Status:</strong> ${status}</p>
        </div>
        <p>Best regards,<br>MediFollow Team</p>
    </div>
    `
}
