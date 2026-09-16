import { COUNTRY_CODES } from "@/data/options";

export default function PersonalInfoSection({
  formData,
  errors,
  onChange,
  sameAsMobile,
  onToggleSameAsMobile,
}) {
  return (
    <div className="space-y-4 pt-4 border-t border-black/[0.05]">
      <div>
        <h3 className="text-xs sm:text-sm font-extrabold tracking-wider text-[#0d1b2a] uppercase">
          Personal Information
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-[#1b263b] mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="fullName"
            placeholder="Enter full name"
            value={formData.fullName}
            onChange={onChange}
            className={`form-input uppercase ${errors.fullName ? "form-input-error" : ""}`}
          />
          {errors.fullName && (
            <p className="text-xs font-medium text-red-500 mt-1">{errors.fullName}</p>
          )}
        </div>

        {/* Place */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-[#1b263b] mb-1">
            Place <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="place"
            placeholder="City / Town / Place"
            value={formData.place}
            onChange={onChange}
            className={`form-input uppercase ${errors.place ? "form-input-error" : ""}`}
          />
          {errors.place && (
            <p className="text-xs font-medium text-red-500 mt-1">{errors.place}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Mobile Number */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-[#1b263b] mb-1">
            Mobile Number <span className="text-red-500">*</span>
          </label>
          <div
            className={`flex items-center rounded-xl bg-[#f3f4f6] border border-black/[0.04] transition-all focus-within:bg-white focus-within:ring-3 focus-within:ring-[#3875b6]/15 ${
              errors.mobileNumber ? "border-red-400 bg-red-50/50 ring-2 ring-red-400/20" : ""
            }`}
          >
            <select
              name="mobileCountryCode"
              value={formData.mobileCountryCode || "+91"}
              onChange={onChange}
              className="bg-transparent py-3 pl-3 pr-1 text-xs sm:text-sm font-bold text-[#0d1b2a] outline-none cursor-pointer border-r border-black/[0.06] shrink-0"
            >
              {COUNTRY_CODES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
            <input
              type="tel"
              name="mobileNumber"
              placeholder="Mobile number"
              value={formData.mobileNumber}
              onChange={onChange}
              className="w-full bg-transparent py-3 px-3 text-xs sm:text-sm text-[#0d1b2a] outline-none tracking-wider font-medium placeholder:text-[#778da9]"
            />
          </div>
          {errors.mobileNumber && (
            <p className="text-xs font-medium text-red-500 mt-1">{errors.mobileNumber}</p>
          )}
        </div>

        {/* WhatsApp Number */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs sm:text-sm font-bold text-[#1b263b]">
              WhatsApp Number
            </label>
            <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3875b6] hover:text-[#234870] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={sameAsMobile}
                onChange={onToggleSameAsMobile}
                className="w-4 h-4 rounded text-[#3875b6] focus:ring-[#3875b6] border-0 bg-[#e5e7eb]"
              />
              <span>Same as Mobile</span>
            </label>
          </div>

          <div
            className={`flex items-center rounded-xl bg-[#f3f4f6] border border-black/[0.04] transition-all ${
              sameAsMobile
                ? "opacity-50 cursor-not-allowed"
                : "focus-within:bg-white focus-within:ring-3 focus-within:ring-[#3875b6]/15"
            }`}
          >
            <select
              name="whatsappCountryCode"
              value={formData.whatsappCountryCode || formData.mobileCountryCode || "+91"}
              onChange={onChange}
              disabled={sameAsMobile}
              className="bg-transparent py-3 pl-3 pr-1 text-xs sm:text-sm font-bold text-[#0d1b2a] outline-none cursor-pointer border-r border-black/[0.06] shrink-0 disabled:cursor-not-allowed"
            >
              {COUNTRY_CODES.map((item) => (
                <option key={item.code} value={item.code}>
                  {item.label}
                </option>
              ))}
            </select>
            <input
              type="tel"
              name="whatsappNumber"
              placeholder="WhatsApp number"
              value={formData.whatsappNumber}
              onChange={onChange}
              disabled={sameAsMobile}
              className="w-full bg-transparent py-3 px-3 text-xs sm:text-sm text-[#0d1b2a] outline-none tracking-wider font-medium placeholder:text-[#778da9] disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
