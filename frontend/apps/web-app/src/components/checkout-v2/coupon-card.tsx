import {
  Button,
  Card,
  CardContent,
  Input,
  Label
} from "@workspace/ui";
import { Ticket as TicketIcon } from "lucide-react";
import { SectionHeader } from "./section-header";
import { Checkout } from "@/__generated__/graphql";

type CouponCardProps = {
  completed: boolean;
  sectionNumber?: number;
  data: Pick<Checkout, "auth" | "id"> | undefined;
  loading: boolean;
};

// שיניתי את שם הרכיב כאן כדי שיתאים לשם הקובץ
export const CouponCard = ({
  sectionNumber,
  completed,
  loading,
}: CouponCardProps) => {

  if (loading) return <AuthCardSkeleton />;

  return (
    <Card dir="rtl" className="flex flex-col gap-4 shadow-xl">
      <SectionHeader
        sectionNumber={sectionNumber || 2}
        title="קוד קופון"
        icon={<TicketIcon className="h-5 w-5 text-primary" />}
        isCompleted={completed}
      />
      <CardContent>
        <form className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="coupon">יש לך קוד קופון?</Label>
            <Input
              id="coupon"
              name="coupon"
              placeholder="הזן קוד קופון"
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            size="lg"
          >
            החל קופון
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

// שם השלד יכול להישאר כפי שהוא
const AuthCardSkeleton = () => {
  // ... a skeleton component ...
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-6 h-6 md:w-8 md:h-8 bg-gray-200 rounded-full animate-pulse" />
        <div>
          <div className="h-4 md:h-5 w-20 bg-gray-200 rounded animate-pulse mb-1" />
          <div className="h-3 md:h-4 w-16 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
      <div className="space-y-4">
        <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </Card>
  );
};