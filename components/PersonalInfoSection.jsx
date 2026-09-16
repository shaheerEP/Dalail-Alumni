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
          <input
            type="tel"
            name="mobileNumber"
            maxLength={10}
            placeholder="10-digit mobile number"
            value={formData.mobileNumber}
            onChange={onChange}
            className={`form-input tracking-wider ${
              errors.mobileNumber ? "form-input-error" : ""
            }`}
          />
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

          <input
            type="tel"
            name="whatsappNumber"
            maxLength={10}
            placeholder="10-digit WhatsApp number"
            value={formData.whatsappNumber}
            onChange={onChange}
            disabled={sameAsMobile}
            className={`form-input tracking-wider ${
              sameAsMobile ? "opacity-50 cursor-not-allowed" : ""
            }`}
          />
        </div>
      </div>
    </div>
  );
}
