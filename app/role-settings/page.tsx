"use client"; // Add this at the top
import React, { useMemo, useRef, useState } from "react";
import { IoMdAdd } from "react-icons/io";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import Pagination from "@/components/shared/Pagination";
import { Copy, Delete, Info } from "lucide-react";
import Link from "next/link";
import { IUserRoles } from "@/utils/types/common.types";
import {
  useUserRolesWithPagination,
  useDeleteMemberRole,
  useCopyUserRole,
} from "@/apis/queries/masters.queries";
import AddToRoleForm from "@/components/modules/teamMembers/AddToRoleForm";
import PermissionForm from "@/components/modules/teamMembers/PermissionForm";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import TrashIcon from "@/public/images/social-delete-icon.svg";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

const RoleSettingsPage = () => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const [isAddToRoleModalOpen, setIsAddToRoleModalOpen] = useState(false);
  const [isAddToPermissionModalOpen, setIsAddToPermissionModalOpen] =
    useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<number>(0);
  const [selectedRoleInfo, setSelectedRoleinfo] = useState("");
  const deleteMemberRole = useDeleteMemberRole();
  const { toast } = useToast();

  const wrapperRef = useRef(null);

  const handleToggleAddModal = () =>
    setIsAddToRoleModalOpen(!isAddToRoleModalOpen);

  const handleOpenPermissionModal = (roleId: number) => {
    setSelectedRoleId(roleId);
    setIsAddToPermissionModalOpen(true);
  };

  const handleClosePermissionModal = () => {
    setIsAddToPermissionModalOpen(false);
    setSelectedRoleId(0); // Reset roleId when closing
  };

  const userRolesQuery = useUserRolesWithPagination({
    page,
    limit,
  });

  const memoizedUserRole = useMemo(() => {
    return userRolesQuery?.data?.data
      ? userRolesQuery.data.data.map((item: IUserRoles) => ({
        label: item.userRoleName,
        value: item.id,
      }))
      : [];
  }, [userRolesQuery?.data?.data]);

  const copyUserRole = useCopyUserRole();

  const copyRole = async (roleInfo: any) => {
    if (copyUserRole?.isPending) return;

    const response = await copyUserRole.mutateAsync({ userRoleId: roleInfo.value });

    if (response.status) {
      toast({
        title: t("role_copy_success"),
        description: response.message,
        variant: "success",
      });
    } else {
      toast({
        title: t("role_copy_failed"),
        description: response.message,
        variant: "danger",
      });
    }
  };

  const handleEditMode = (roleInfo: any) => {
    setSelectedRoleinfo(roleInfo);
    handleToggleAddModal();
  };

  const handleToDelete = async (id: number) => {
    const response = await deleteMemberRole.mutateAsync({ id });
    if (response.status) {
      toast({
        title: response.message,
        description: response.message,
        variant: "success",
      });
    } else {
      toast({
        title: response.message,
        description: response.message,
        variant: "danger",
      });
    }
  };

  return (
    <section className="team_members_section">
      <div className="container relative z-10 m-auto px-3">
        <div className="flex w-full flex-wrap">
          <div className="mb-5 w-full" dir={langDir}>
            <ul className="flex w-full items-center justify-start gap-1">
              <Link
                href={"/team-members"}
                className="flex items-center border-0 bg-dark-orange px-3 py-2 text-sm font-medium capitalize leading-6 text-white"
                translate="no"
              >
                {t("team_members")}
              </Link>
              <Link
                href={"/role-settings"}
                className="flex items-center border-0 bg-dark-orange px-3 py-2 text-sm font-medium capitalize leading-6 text-white"
                translate="no"
              >
                {t("role")}
              </Link>
            </ul>
          </div>
          <div className="team_members_heading w-full" dir={langDir}>
            <h1 dir={langDir} translate="no">{t("role_settings")}</h1>
            <button type="button" onClick={handleToggleAddModal} dir={langDir} translate="no">
              <IoMdAdd /> {t("add_new_role")}
            </button>
          </div>
          <div className="team_members_table w-full">
            {!userRolesQuery?.isLoading && memoizedUserRole.length ? (
              <>
                <table cellPadding={0} cellSpacing={0} border={0}>
                  <thead>
                    <tr>
                      <th dir={langDir} translate="no">{t("role_name")}</th>
                      <th dir={langDir} translate="no">{t("permission")}</th>
                      <th dir={langDir} translate="no">{t("action")}</th>
                    </tr>
                  </thead>

                  <tbody>
                    {memoizedUserRole?.map((item: any) => (
                      <tr key={item.id}>
                        <td>{item?.label || "-----"}</td>
                        <td>
                          {" "}
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenPermissionModal(item?.value)
                            }
                            dir={langDir}
                            translate="no"
                          >
                            {t("setup_permission")}
                          </button>
                        </td>
                        <td>
                          {" "}
                          <div className="flex items-center gap-1">
                            <Copy
                              className={`h-4 w-4 mr-1 ${!copyUserRole.isPending ? 'cursor-pointer' : ''} text-gray-500`}
                              onClick={() => copyRole(item)}
                            />
                            <Info
                              className="h-4 w-4 cursor-pointer text-gray-500"
                              onClick={() => handleEditMode(item)}
                            />
                            <a
                              className="cursor-pointer"
                              onClick={() => handleToDelete(item.value)}
                            >
                              <Image
                                src={TrashIcon}
                                alt="social-delete-icon"
                              />{" "}
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : null}

            {!userRolesQuery?.isLoading && !memoizedUserRole.length ? (
              <p className="py-10 text-center text-sm font-medium" translate="no">
                {t("no_roles_found")}
              </p>
            ) : null}

            {userRolesQuery.data?.totalCount > limit ? (
              <Pagination
                page={page}
                setPage={setPage}
                totalCount={userRolesQuery.data?.totalCount}
                limit={limit}
              />
            ) : null}
          </div>
        </div>
      </div>

      {/* Add Role Dialog */}
      <Dialog open={isAddToRoleModalOpen} onOpenChange={handleToggleAddModal}>
        <DialogContent
          className="add-new-address-modal add_member_modal gap-0 p-0 md:max-w-2xl!"
          ref={wrapperRef}
        >
          <AddToRoleForm
            onClose={() => {
              setIsAddToRoleModalOpen(false);
              setSelectedRoleinfo("");
            }}
            updatePermission={(roleId: number) => handleOpenPermissionModal(roleId)}
            roleDetails={selectedRoleInfo}
          />
        </DialogContent>
      </Dialog>

      {/* Add Edit permission Modal */}
      <Dialog
        open={isAddToPermissionModalOpen}
        onOpenChange={handleClosePermissionModal}
      >
        <DialogContent
          className="add-new-address-modal add_member_modal gap-0 p-0 md:max-w-2xl!"
          ref={wrapperRef}
        >
          <PermissionForm
            roleId={selectedRoleId} // Pass roleId to the form
            onClose={handleClosePermissionModal}
          />
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default RoleSettingsPage;
