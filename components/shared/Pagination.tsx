import React from "react";
import { Button } from "../ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import ReactPaginate from "react-paginate";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";

type PaginationProps = {
  totalCount: number;
  page: number;
  setPage: (page: number) => void;
  limit: number;
};

const Pagination: React.FC<PaginationProps> = ({
  totalCount = 0,
  page,
  setPage,
  limit,
}) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const itemsPerPage = limit;
  const pageCount = totalCount && Math.ceil(totalCount / itemsPerPage);

  const handlePageClick = (event: any) => {
    setPage(event.selected + 1);
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-center py-4 sm:py-8">
      <nav className="flex items-center gap-1 sm:gap-2" aria-label="Pagination">
        {/* First Page Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 sm:h-10 px-2 sm:px-4 gap-1 sm:gap-2 bg-white border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => setPage(1)}
          disabled={page === 1}
          translate="no"
        >
          <ChevronsLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="hidden sm:inline text-xs sm:text-sm">{t("first")}</span>
        </Button>

        {/* Previous Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 sm:h-10 sm:w-10 p-0 bg-white border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
        >
          <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>

        {/* Page Numbers */}
        <ReactPaginate
          breakLabel="..."
          breakClassName="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10"
          breakLinkClassName="text-gray-500 font-medium text-xs sm:text-sm"
          onPageChange={handlePageClick}
          pageRangeDisplayed={2}
          marginPagesDisplayed={1}
          pageCount={pageCount}
          forcePage={page - 1}
          renderOnZeroPageCount={null}
          containerClassName="flex items-center gap-1 sm:gap-2"
          pageClassName="flex"
          pageLinkClassName="flex items-center justify-center h-8 w-8 sm:h-10 sm:w-10 rounded-md sm:rounded-lg border border-gray-300 bg-white text-gray-700 font-medium text-xs sm:text-sm hover:bg-gray-50 hover:border-gray-400 transition-colors"
          activeClassName="active"
          activeLinkClassName="!bg-orange-600 !text-white !border-orange-600 hover:!bg-orange-700"
          previousClassName="hidden"
          nextClassName="hidden"
        />

        {/* Next Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 sm:h-10 sm:w-10 p-0 bg-white border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => setPage(page + 1)}
          disabled={page === pageCount}
        >
          <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>

        {/* Last Page Button */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 sm:h-10 px-2 sm:px-4 gap-1 sm:gap-2 bg-white border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => setPage(pageCount)}
          disabled={page === pageCount}
          dir={langDir}
          translate="no"
        >
          <span className="hidden sm:inline text-xs sm:text-sm">{t("last")}</span>
          <ChevronsRight className="h-3 w-3 sm:h-4 sm:w-4" />
        </Button>
      </nav>
    </div>
  );
};

export default Pagination;
