import { useSelector } from 'react-redux';
import { selectCurrentToken } from '../features/auth/authSlice';
import jwtDecode from 'jwt-decode';

/**
 * useAuth is a custom React hook that provides authentication information.
 * It returns an object with the following properties:
 * - username: The username of the authenticated user.
 * - roles: An array of roles assigned to the user.
 * - isAdmin: A boolean indicating if the user is an admin.
 * - isManager: A boolean indicating if the user is a manager.
 * - status: A string representing the status of the user (Employee, Manager, or Admin).
 *
 * @returns {Object} The authentication information object.
 */
const useAuth = () => {
	const token = useSelector(selectCurrentToken);
	let isAdmin = false;
	let isManager = false;
	let status = 'Employee';

	if (token) {
		const decodedToken = jwtDecode(token);
		const { username, roles } = decodedToken.UserInfo;

		isManager = roles.includes('Manager');
		isAdmin = roles.includes('Admin');

		if (isManager) status = 'Manager';
		if (isAdmin) status = 'Admin';

		return { username, roles, isAdmin, isManager, status };
	}
	return { username: '', roles: [], isAdmin, isManager, status };
};

export default useAuth;
