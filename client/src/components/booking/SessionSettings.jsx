// import { useState, useEffect } from 'react';
// import { bookingService } from '../../api';
// import { formatDateInTimezone, formatTimeWithTimezone, getUserTimezone } from '../../utils/timezone';
// import Button from '../shared/Button';
// import Toast from '../shared/Toast';
// import AvailabilityCalendar from './AvailabilityCalendar';

// const SessionSettings = () => {
//   const [activeTab, setActiveTab] = useState('availability');
//   const [bookings, setBookings] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [selectedBooking, setSelectedBooking] = useState(null);
//   const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
//   const [userTimezone] = useState(getUserTimezone());

//   const tabs = [
//     { id: 'availability', label: 'Availability Settings', icon: '📅' },
//     { id: 'bookings', label: 'My Bookings', icon: '📋' },
//   ];

//   useEffect(() => {
//     if (activeTab === 'bookings') {
//       fetchBookings();
//     }
//   }, [activeTab]);

//   const fetchBookings = async () => {
//     try {
//       setLoading(true);
//       const response = await bookingService.getMyBookings({ 
//         upcoming: 'true',
//         limit: 50 
//       });
//       setBookings(response.bookings || []);
//     } catch (error) {
//       console.error('Error fetching bookings:', error);
//       showToast('Failed to load bookings', 'error');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleUpdateBookingStatus = async (bookingId, status, meetingLink = '', meetingPlatform = 'zoom') => {
//     try {
//       const updateData = { status };
//       if (meetingLink) updateData.meetingLink = meetingLink;
//       if (meetingPlatform) updateData.meetingPlatform = meetingPlatform;

//       await bookingService.updateBookingStatus(bookingId, updateData);
//       showToast('Booking updated successfully');
//       fetchBookings();
//       setSelectedBooking(null);
//     } catch (error) {
//       console.error('Error updating booking:', error);
//       showToast(error.message || 'Failed to update booking', 'error');
//     }
//   };

//   const handleCancelBooking = async (bookingId, reason) => {
//     try {
//       await bookingService.cancelBooking(bookingId, reason);
//       showToast('Booking cancelled successfully');
//       fetchBookings();
//     } catch (error) {
//       console.error('Error cancelling booking:', error);
//       showToast(error.message || 'Failed to cancel booking', 'error');
//     }
//   };

//   const showToast = (message, type = 'success') => {
//     setToast({ show: true, message, type });
//     setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000);
//   };

//   const getStatusColor = (status) => {
//     switch (status) {
//       case 'confirmed': return 'text-green-600 bg-green-100';
//       case 'pending': return 'text-yellow-600 bg-yellow-100';
//       case 'completed': return 'text-blue-600 bg-blue-100';
//       case 'cancelled': return 'text-red-600 bg-red-100';
//       case 'no-show': return 'text-gray-600 bg-gray-100';
//       default: return 'text-gray-600 bg-gray-100';
//     }
//   };

//   const formatParticipants = (booking) => {
//     if (booking.sessionType === '1:1') {
//       return `${booking.mentee?.firstName} ${booking.mentee?.lastName}`;
//     } else {
//       const count = booking.participants?.length || 0;
//       return `${count} participant${count !== 1 ? 's' : ''}`;
//     }
//   };

//   return (
//     <div className="max-w-6xl mx-auto p-6">
//       {/* Tab Navigation */}
//       <div className="bg-white rounded-lg shadow-md mb-6">
//         <div className="border-b border-gray-200">
//           <nav className="flex space-x-8 px-6">
//             {tabs.map((tab) => (
//               <button
//                 key={tab.id}
//                 onClick={() => setActiveTab(tab.id)}
//                 className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
//                   activeTab === tab.id
//                     ? 'border-primary-500 text-primary-600'
//                     : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
//                 }`}
//               >
//                 <span className="mr-2">{tab.icon}</span>
//                 {tab.label}
//               </button>
//             ))}
//           </nav>
//         </div>
//       </div>

//       {/* Tab Content */}
//       {activeTab === 'availability' && (
//         <AvailabilityCalendar />
//       )}

//       {activeTab === 'bookings' && (
//         <div className="bg-white rounded-lg shadow-md">
//           <div className="px-6 py-4 border-b border-gray-200">
//             <h3 className="text-lg font-semibold text-gray-900">Upcoming Bookings</h3>
//             <p className="text-sm text-gray-600 mt-1">
//               Manage your scheduled sessions and update meeting details
//             </p>
//           </div>

//           <div className="p-6">
//             {loading ? (
//               <div className="flex items-center justify-center py-8">
//                 <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
//                 <span className="ml-2 text-gray-600">Loading bookings...</span>
//               </div>
//             ) : bookings.length > 0 ? (
//               <div className="space-y-4">
//                 {bookings.map((booking) => (
//                   <div key={booking._id} className="border border-gray-200 rounded-lg p-4">
//                     <div className="flex justify-between items-start">
//                       <div className="flex-1">
//                         <div className="flex items-center space-x-3 mb-2">
//                           <h4 className="font-medium text-gray-900">
//                             {formatParticipants(booking)}
//                           </h4>
//                           <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
//                             {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
//                           </span>
//                           <span className={`px-2 py-1 text-xs font-medium rounded-full ${
//                             booking.sessionType === '1:1' ? 'text-blue-600 bg-blue-100' : 'text-purple-600 bg-purple-100'
//                           }`}>
//                             {booking.sessionType === '1:1' ? '1:1 Session' : 'Mega Session'}
//                           </span>
//                         </div>
                        
//                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
//                           <div>
//                             <span className="font-medium">Date:</span>
//                             <br />
//                             {formatDateInTimezone(booking.scheduledDate, userTimezone)}
//                           </div>
//                           <div>
//                             <span className="font-medium">Time:</span>
//                             <br />
//                             {booking.startTime} - {booking.endTime} ({userTimezone})
//                           </div>
//                           <div>
//                             <span className="font-medium">Duration:</span>
//                             <br />
//                             {booking.duration} minutes
//                           </div>
//                         </div>

//                         {booking.notes && (
//                           <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
//                             <span className="font-medium text-gray-700">Notes:</span>
//                             <p className="text-gray-600 mt-1">{booking.notes}</p>
//                           </div>
//                         )}

//                         {booking.meetingLink && (
//                           <div className="mt-3">
//                             <a
//                               href={booking.meetingLink}
//                               target="_blank"
//                               rel="noopener noreferrer"
//                               className="text-primary-600 hover:text-primary-700 text-sm font-medium"
//                             >
//                               🔗 Join Meeting
//                             </a>
//                           </div>
//                         )}

//                         {booking.sessionType === 'mega' && booking.participants && (
//                           <div className="mt-3">
//                             <span className="text-sm font-medium text-gray-700">Participants:</span>
//                             <div className="mt-1 space-y-1">
//                               {booking.participants.map((participant, index) => (
//                                 <div key={index} className="text-sm text-gray-600">
//                                   • {participant.user?.firstName} {participant.user?.lastName}
//                                 </div>
//                               ))}
//                             </div>
//                           </div>
//                         )}
//                       </div>

//                       <div className="flex flex-col space-y-2 ml-4">
//                         <Button
//                           onClick={() => setSelectedBooking(booking)}
//                           className="btn-primary-outline text-xs px-3 py-1"
//                         >
//                           Manage
//                         </Button>
                        
//                         {booking.status === 'confirmed' && (
//                           <Button
//                             onClick={() => {
//                               const reason = prompt('Please provide a reason for cancellation:');
//                               if (reason) {
//                                 handleCancelBooking(booking._id, reason);
//                               }
//                             }}
//                             className="bg-red-100 text-red-600 hover:bg-red-200 text-xs px-3 py-1 rounded"
//                           >
//                             Cancel
//                           </Button>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             ) : (
//               <div className="text-center py-8 text-gray-500">
//                 <p>No upcoming bookings found.</p>
//                 <p className="text-sm">Your scheduled sessions will appear here.</p>
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Booking Management Modal */}
//       {selectedBooking && (
//         <BookingManagementModal
//           booking={selectedBooking}
//           onUpdate={handleUpdateBookingStatus}
//           onClose={() => setSelectedBooking(null)}
//         />
//       )}

//       {/* Toast Notification */}
//       {toast.show && (
//         <Toast
//           message={toast.message}
//           type={toast.type}
//           onClose={() => setToast({ show: false, message: '', type: 'success' })}
//         />
//       )}
//     </div>
//   );
// };

// // Booking Management Modal Component
// const BookingManagementModal = ({ booking, onUpdate, onClose }) => {
//   const [status, setStatus] = useState(booking.status);
//   const [meetingLink, setMeetingLink] = useState(booking.meetingLink || '');
//   const [meetingPlatform, setMeetingPlatform] = useState(booking.meetingPlatform || 'zoom');

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     onUpdate(booking._id, status, meetingLink, meetingPlatform);
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
//         <h3 className="text-lg font-semibold mb-4">Manage Booking</h3>
        
//         <form onSubmit={handleSubmit} className="space-y-4">
//           {/* Status */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Status
//             </label>
//             <select
//               value={status}
//               onChange={(e) => setStatus(e.target.value)}
//               className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
//             >
//               <option value="confirmed">Confirmed</option>
//               <option value="completed">Completed</option>
//               <option value="cancelled">Cancelled</option>
//               <option value="no-show">No Show</option>
//             </select>
//           </div>

//           {/* Meeting Platform */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Meeting Platform
//             </label>
//             <select
//               value={meetingPlatform}
//               onChange={(e) => setMeetingPlatform(e.target.value)}
//               className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
//             >
//               <option value="zoom">Zoom</option>
//               <option value="meet">Google Meet</option>
//               <option value="teams">Microsoft Teams</option>
//               <option value="other">Other</option>
//             </select>
//           </div>

//           {/* Meeting Link */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-2">
//               Meeting Link
//             </label>
//             <input
//               type="url"
//               value={meetingLink}
//               onChange={(e) => setMeetingLink(e.target.value)}
//               className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
//               placeholder="https://zoom.us/j/..."
//             />
//           </div>

//           {/* Buttons */}
//           <div className="flex space-x-3 pt-4">
//             <Button type="submit" className="btn-primary flex-1">
//               Update Booking
//             </Button>
//             <Button 
//               type="button"
//               onClick={onClose}
//               className="btn-primary-outline flex-1"
//             >
//               Cancel
//             </Button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default SessionSettings;
