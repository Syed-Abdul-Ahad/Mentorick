// import { useState, useEffect } from 'react';
// import { bookingService } from '../../api';
// import { formatDateInTimezone, getUserTimezone } from '../../utils/timezone';
// import { useUser } from '../../store/hooks';
// import Button from '../shared/Button';
// import FormInput from '../shared/FormInput';
// import Toast from '../shared/Toast';

// const BookingManagement = () => {
//   const user = useUser();
//   const [bookings, setBookings] = useState([]);
//   const [loading, setLoading] = useState(false);
//   const [selectedBooking, setSelectedBooking] = useState(null);
//   const [showModal, setShowModal] = useState(false);
//   const [userTimezone] = useState(getUserTimezone());
//   const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
//   const [filter, setFilter] = useState('all');
//   const [searchTerm, setSearchTerm] = useState('');

//   const [meetingData, setMeetingData] = useState({
//     meetingLink: '',
//     meetingPlatform: 'zoom',
//     status: 'confirmed'
//   });

//   useEffect(() => {
//     fetchBookings();
//   }, []);

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

//   const handleUpdateBooking = async (e) => {
//     e.preventDefault();
//     try {
//       setLoading(true);
//       await bookingService.updateBookingStatus(selectedBooking._id, meetingData);
//       showToast('Booking updated successfully');
//       setShowModal(false);
//       fetchBookings();
//       resetModal();
//     } catch (error) {
//       console.error('Error updating booking:', error);
//       showToast(error.response?.data?.message || 'Failed to update booking', 'error');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleCancelBooking = async (bookingId, reason = '') => {
//     if (window.confirm('Are you sure you want to cancel this booking?')) {
//       try {
//         await bookingService.cancelBooking(bookingId, { reason });
//         showToast('Booking cancelled successfully');
//         fetchBookings();
//       } catch (error) {
//         console.error('Error cancelling booking:', error);
//         showToast('Failed to cancel booking', 'error');
//       }
//     }
//   };

//   const openUpdateModal = (booking) => {
//     setSelectedBooking(booking);
//     setMeetingData({
//       meetingLink: booking.meetingLink || '',
//       meetingPlatform: booking.meetingPlatform || 'zoom',
//       status: booking.status
//     });
//     setShowModal(true);
//   };

//   const resetModal = () => {
//     setSelectedBooking(null);
//     setMeetingData({
//       meetingLink: '',
//       meetingPlatform: 'zoom',
//       status: 'confirmed'
//     });
//     setShowModal(false);
//   };

//   const showToast = (message, type = 'success') => {
//     setToast({ show: true, message, type });
//     setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
//   };

//   const getStatusColor = (status) => {
//     switch (status) {
//       case 'confirmed': return 'bg-green-100 text-green-800';
//       case 'pending': return 'bg-yellow-100 text-yellow-800';
//       case 'completed': return 'bg-blue-100 text-blue-800';
//       case 'cancelled': return 'bg-red-100 text-red-800';
//       case 'no-show': return 'bg-gray-100 text-gray-800';
//       default: return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const formatParticipants = (booking) => {
//     if (user?.role === 'mentor') {
//       return `${booking.mentee?.firstName} ${booking.mentee?.lastName}`;
//     } else {
//       return `${booking.mentor?.user?.firstName} ${booking.mentor?.user?.lastName}`;
//     }
//   };

//   const filteredBookings = bookings.filter(booking => {
//     const matchesFilter = filter === 'all' || booking.status === filter;
//     const matchesSearch = searchTerm === '' || 
//       formatParticipants(booking).toLowerCase().includes(searchTerm.toLowerCase()) ||
//       booking.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
//     return matchesFilter && matchesSearch;
//   });

//   const statusCounts = {
//     all: bookings.length,
//     confirmed: bookings.filter(b => b.status === 'confirmed').length,
//     completed: bookings.filter(b => b.status === 'completed').length,
//     cancelled: bookings.filter(b => b.status === 'cancelled').length,
//     pending: bookings.filter(b => b.status === 'pending').length
//   };

//   return (
//     <div className="space-y-6">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
//           <p className="text-gray-600 mt-1">
//             {user?.role === 'mentor' 
//               ? 'Manage your scheduled mentoring sessions and add meeting details'
//               : 'View your upcoming mentoring sessions and session details'
//             }
//           </p>
//         </div>
        
//         {/* Search Bar */}
//         <div className="mt-4 sm:mt-0">
//           <FormInput
//             type="text"
//             placeholder="Search bookings..."
//             value={searchTerm}
//             onChange={(e) => setSearchTerm(e.target.value)}
//             className="w-full sm:w-80"
//           />
//         </div>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//         {[
//           { 
//             key: 'all', 
//             label: 'Total', 
//             icon: (
//               <svg className="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
//                 <path d="M3 4a1 1 0 011-1h12a1 1 0 010 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h6a1 1 0 010 2H4a1 1 0 01-1-1zM3 16a1 1 0 011-1h12a1 1 0 010 2H4a1 1 0 01-1-1z" />
//               </svg>
//             )
//           },
//           { 
//             key: 'confirmed', 
//             label: 'Confirmed', 
//             icon: (
//               <svg className="w-6 h-6 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
//                 <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
//               </svg>
//             )
//           },
//           { 
//             key: 'completed', 
//             label: 'Completed', 
//             icon: (
//               <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
//                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
//               </svg>
//             )
//           },
//           { 
//             key: 'pending', 
//             label: 'Pending', 
//             icon: (
//               <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
//                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
//               </svg>
//             )
//           }
//         ].map(({ key, label, icon }) => (
//           <button
//             key={key}
//             onClick={() => setFilter(key)}
//             className={`bg-white rounded-lg p-4 border transition-all duration-200 hover:shadow-md ${
//               filter === key 
//                 ? 'border-primary-500 shadow-md' 
//                 : 'border-gray-200 hover:border-gray-300'
//             }`}
//           >
//             <div className="flex items-center justify-center mb-2">
//               {icon}
//             </div>
//             <div className="text-2xl font-bold text-gray-900 mb-1">{statusCounts[key]}</div>
//             <div className="text-sm text-gray-600">{label}</div>
//           </button>
//         ))}
//       </div>

//       {/* Bookings List */}
//       <div className="bg-white rounded-lg border border-gray-200">
//         <div className="px-6 py-4 border-b border-gray-200">
//           <h2 className="text-lg font-semibold text-gray-900">
//             {filter === 'all' ? 'All Bookings' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Bookings`}
//             <span className="ml-2 text-sm font-normal text-gray-500">
//               ({filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'})
//             </span>
//           </h2>
//         </div>

//         {loading ? (
//           <div className="flex items-center justify-center py-12">
//             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
//             <span className="ml-3 text-gray-600">Loading bookings...</span>
//           </div>
//         ) : filteredBookings.length > 0 ? (
//           <div className="divide-y divide-gray-200">
//             {filteredBookings.map((booking) => (
//               <div key={booking._id} className="p-6">
//                 <div className="flex items-start justify-between">
//                   <div className="flex items-start space-x-4 flex-1">
//                     {/* Calendar Icon */}
//                     <div className="flex-shrink-0 w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center">
//                       <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
//                         <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
//                       </svg>
//                     </div>

//                     {/* Booking Details */}
//                     <div className="flex-1 min-w-0">
//                       <div className="flex items-center space-x-3 mb-2">
//                         <h3 className="text-lg font-medium text-gray-900">
//                           {formatParticipants(booking)}
//                         </h3>
//                         <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
//                           {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
//                         </span>
//                         <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
//                           {booking.duration} minutes
//                         </span>
//                       </div>

//                       {/* Details Grid */}
//                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
//                         <div className="flex items-center space-x-2">
//                           <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
//                             <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
//                           </svg>
//                           <div>
//                             <div className="text-sm font-medium text-gray-700">Date</div>
//                             <div className="text-sm text-gray-600">
//                               {formatDateInTimezone(booking.scheduledDate, userTimezone)}
//                             </div>
//                           </div>
//                         </div>
                        
//                         <div className="flex items-center space-x-2">
//                           <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
//                             <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
//                           </svg>
//                           <div>
//                             <div className="text-sm font-medium text-gray-700">Time</div>
//                             <div className="text-sm text-gray-600">
//                               {booking.startTime} - {booking.endTime}
//                             </div>
//                             <div className="text-xs text-gray-500">{userTimezone}</div>
//                           </div>
//                         </div>

//                         {booking.meetingPlatform && (
//                           <div className="flex items-center space-x-2">
//                             <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
//                               <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
//                             </svg>
//                             <div>
//                               <div className="text-sm font-medium text-gray-700">Platform</div>
//                               <div className="text-sm text-gray-600 capitalize">{booking.meetingPlatform}</div>
//                             </div>
//                           </div>
//                         )}
//                       </div>

//                       {/* Notes */}
//                       {booking.notes && (
//                         <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
//                           <div className="flex items-center space-x-2 mb-2">
//                             <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
//                               <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
//                             </svg>
//                             <span className="text-sm font-medium text-gray-700">Session Notes</span>
//                           </div>
//                           <p className="text-sm text-gray-600">{booking.notes}</p>
//                         </div>
//                       )}

//                       {/* Meeting Link */}
//                       {booking.meetingLink && (
//                         <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
//                           <div className="flex items-center space-x-2 mb-2">
//                             <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
//                               <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
//                             </svg>
//                             <span className="text-sm font-medium text-green-700">Meeting Link</span>
//                           </div>
//                           <a
//                             href={booking.meetingLink}
//                             target="_blank"
//                             rel="noopener noreferrer"
//                             className="text-sm text-green-600 hover:text-green-700 underline break-all"
//                           >
//                             {booking.meetingLink}
//                           </a>
//                         </div>
//                       )}
//                     </div>
//                   </div>

//                   {/* Action Button */}
//                   <div className="flex-shrink-0 ml-4">
//                     {user?.role === 'mentor' && booking.status !== 'cancelled' && booking.status !== 'completed' && (
//                       <Button
//                         onClick={() => openUpdateModal(booking)}
//                         className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 text-sm"
//                       >
//                         Update
//                       </Button>
//                     )}
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <div className="text-center py-12">
//             <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
//               <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
//                 <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
//               </svg>
//             </div>
//             <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
//             <p className="text-gray-500">
//               {filter === 'all' 
//                 ? user?.role === 'mentor' 
//                   ? 'Your scheduled sessions will appear here.'
//                   : 'Your booked sessions will appear here.'
//                 : `No ${filter} bookings found.`
//               }
//             </p>
//           </div>
//         )}
//       </div>

//       {/* Update Booking Modal */}
//       {showModal && selectedBooking && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
//             <div className="flex items-center justify-between mb-6">
//               <h3 className="text-xl font-semibold text-gray-900">Update Booking</h3>
//               <button
//                 onClick={resetModal}
//                 className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
//               >
//                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                 </svg>
//               </button>
//             </div>

//             <form onSubmit={handleUpdateBooking} className="space-y-4">
//               {/* Status */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Status
//                 </label>
//                 <select
//                   value={meetingData.status}
//                   onChange={(e) => setMeetingData({ ...meetingData, status: e.target.value })}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
//                 >
//                   <option value="confirmed">Confirmed</option>
//                   <option value="completed">Completed</option>
//                   <option value="pending">Pending</option>
//                   <option value="cancelled">Cancelled</option>
//                   <option value="no-show">No Show</option>
//                 </select>
//               </div>

//               {/* Meeting Platform */}
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">
//                   Meeting Platform
//                 </label>
//                 <select
//                   value={meetingData.meetingPlatform}
//                   onChange={(e) => setMeetingData({ ...meetingData, meetingPlatform: e.target.value })}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
//                 >
//                   <option value="zoom">Zoom</option>
//                   <option value="meet">Google Meet</option>
//                   <option value="teams">Microsoft Teams</option>
//                   <option value="other">Other</option>
//                 </select>
//               </div>

//               {/* Meeting Link */}
//               <FormInput
//                 label="Meeting Link"
//                 type="url"
//                 value={meetingData.meetingLink}
//                 onChange={(e) => setMeetingData({ ...meetingData, meetingLink: e.target.value })}
//                 placeholder="https://zoom.us/j/123456789"
//               />

//               {/* Buttons */}
//               <div className="flex space-x-3 pt-4">
//                 <Button
//                   type="submit"
//                   disabled={loading}
//                   className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2"
//                 >
//                   {loading ? (
//                     <div className="flex items-center justify-center">
//                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
//                       Updating...
//                     </div>
//                   ) : (
//                     'Update Booking'
//                   )}
//                 </Button>
//                 <Button
//                   type="button"
//                   onClick={resetModal}
//                   className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2"
//                 >
//                   Cancel
//                 </Button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* Toast */}
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

// export default BookingManagement;