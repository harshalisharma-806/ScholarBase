/* ScholarBase front-end configuration: dropdown vocabularies only. All records come from the server. */
window.SB = window.SB || {};

SB.config = {
  departments: [
    'Artificial Intelligence & ML',
    'Computer Science & Engineering',
    'Electronics & Communication',
    'Mechanical Engineering',
    'Civil Engineering'
  ],
  semesters: [1, 2, 3, 4, 5, 6, 7, 8],
  genders: [['MALE', 'Male'], ['FEMALE', 'Female'], ['OTHER', 'Other']],
  studentStatuses: [['ACTIVE', 'Active'], ['INACTIVE', 'Inactive']]
};

/* Resolve URLs relative to the app root whether we are on /login.html or /app/*.html */
SB.base = location.pathname.indexOf('/app/') !== -1
  ? location.pathname.slice(0, location.pathname.indexOf('/app/') + 1)
  : location.pathname.slice(0, location.pathname.lastIndexOf('/') + 1);
SB.url = function (path) { return SB.base + path; };
