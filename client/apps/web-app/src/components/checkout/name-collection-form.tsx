"use client";

import { useState } from "react";
import { Button } from "@workspace/ui";
import { Input } from "@workspace/ui";
import { Label } from "@workspace/ui";
import { useMutation } from "@apollo/client";
import { UPDATE_PROFILE } from "@/lib/graphql/mutations";
import { UpdateProfileResponse } from "@/lib/types";

interface NameCollectionFormProps {
  onComplete: () => void;
}

export function NameCollectionForm({ onComplete }: NameCollectionFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  
  const [updateProfile, { loading }] = useMutation<
    { updateProfile: UpdateProfileResponse },
    { input: { firstName: string; lastName: string } }
  >(UPDATE_PROFILE);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!firstName.trim() || !lastName.trim()) {
      setError("שם פרטי ושם משפחה הם שדות חובה");
      return;
    }

    try {
      const { data } = await updateProfile({
        variables: {
          input: {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
          },
        },
      });

      if (data?.updateProfile?.success) {
        onComplete();
      } else {
        setError(data?.updateProfile?.error || "שגיאה בעדכון הפרטים");
      }
    } catch (err) {
      setError("שגיאה בעדכון הפרטים");
      console.error("Update profile error:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-sm text-muted-foreground mb-4">
        כדי להשלים את ההזמנה, אנא הזן את השם המלא שלך לקבלה
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="firstName">שם פרטי *</Label>
        <Input
          id="firstName"
          type="text"
          placeholder="ישראל"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lastName">שם משפחה *</Label>
        <Input
          id="lastName"
          type="text"
          placeholder="ישראלי"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "שומר..." : "שמור והמשך"}
      </Button>
    </form>
  );
}