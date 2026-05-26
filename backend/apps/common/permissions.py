"""
Common App - Custom Permissions
=================================
DRF permissions control who can access which endpoints.
"""

from rest_framework.permissions import BasePermission


class IsOwner(BasePermission):
    """
    Only allow access to the owner of the object.
    Used for: documents, quiz attempts, etc.

    The view must set `owner_field` or the object must have a `user` attribute.
    """
    message = "You do not have permission to access this resource."

    def has_object_permission(self, request, view, obj):
        # Check if the object belongs to the requesting user
        owner_field = getattr(view, 'owner_field', 'user')
        owner = getattr(obj, owner_field, None)
        return owner == request.user


class IsOwnerOrReadOnly(BasePermission):
    """
    Allow read access to everyone (authenticated), but only owners can write.
    """

    def has_object_permission(self, request, view, obj):
        # GET, HEAD, OPTIONS are safe read methods
        from rest_framework.permissions import SAFE_METHODS
        if request.method in SAFE_METHODS:
            return True
        return obj.user == request.user
