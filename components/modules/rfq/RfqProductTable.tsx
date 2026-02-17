import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import validator from "validator";
import { TrendingProduct } from "@/utils/types/common.types";
import PlaceholderImage from "@/public/images/product-placeholder.png";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import { useDynamicTranslation } from "@/hooks/useDynamicTranslation";

type ProducTableProps = {
  list: TrendingProduct[];
};

const RfqProductTable: React.FC<ProducTableProps> = ({ list }) => {
  const t = useTranslations();
  const { langDir } = useAuth();
  const { translate } = useDynamicTranslation();

  return (
    <CardContent className="main-content w-full">
      <Card className="main-content-card p-0! shadow-none">
        <div className="table-responsive theme-table-s1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead dir={langDir} translate="no">{t("product")}</TableHead>
                <TableHead dir={langDir} translate="no">{t("category")}</TableHead>
                {/* FIXME:  link disabled due to TYPE R product. error in find one due to no price */}
                {/* <TableHead>SKU No</TableHead> */}
                <TableHead dir={langDir} translate="no">{t("brand")}</TableHead>
                {/* <TableHead>Price</TableHead> */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {list?.map((item: any) => (
                <TableRow key={item.id}>
                  <TableCell th-name="Product">
                    {/* <Link href={`/trending/${item.id}`}> */}
                    <figure className="product-image-with-text">
                      <div className="image-container rounded-lg">
                        <Image
                          src={
                            item.productImages?.[0]?.image &&
                            validator.isURL(item.productImages[0].image)
                              ? item.productImages[0].image
                              : PlaceholderImage
                          }
                          alt="product-image"
                          height={80}
                          width={80}
                        />
                      </div>
                      <figcaption>{translate(item?.productName)}</figcaption>
                    </figure>
                    {/* </Link> */}
                  </TableCell>
                  <TableCell th-name="Category">
                    {item?.category?.name || "-"}
                  </TableCell>
                  {/* <TableCell th-name="SKU No">{item?.skuNo}</TableCell> */}
                  <TableCell th-name="Brand">
                    {item?.brand?.brandName || "-"}
                  </TableCell>
                  {/* <TableCell th-name="Price">
                    ${item?.offerPrice || 0}
                  </TableCell> */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {/* <ul className="theme-pagination-s1">
          <li>
            <Button type="button" className="theme-primary-btn first">
              <Image
                src="/images/pagination-first.svg"
                alt="next-icon"
                height={0}
                width={0}
                className="h-auto w-[7px]"
              />
              First
            </Button>
          </li>
          <li>
            <Button type="button" className="nextPrev">
              <Image
                src="/images/pagination-prev.svg"
                alt="prev-icon"
                height={0}
                width={0}
                className="h-auto w-[7px]"
              />
            </Button>
          </li>
          <li>
            <Button type="button" className="current">
              1
            </Button>
          </li>
          <li>
            <Button type="button">2</Button>
          </li>
          <li>
            <Button type="button">3</Button>
          </li>
          <li>
            <Button type="button">4</Button>
          </li>
          <li>
            <Button type="button">5</Button>
          </li>
          <li>
            <Button type="button" className="nextPrev">
              <Image
                src="/images/pagination-next.svg"
                alt="next-icon"
                width={0}
                height={0}
                className="h-auto w-[7px]"
              />
            </Button>
          </li>
          <li>
            <Button type="button" className="theme-primary-btn last">
              Last
              <Image
                src="/images/pagination-last.svg"
                alt="next-icon"
                height={0}
                width={0}
                className="h-auto w-[7px]"
              />
            </Button>
          </li>
        </ul> */}
      </Card>
    </CardContent>
  );
};

export default RfqProductTable;
